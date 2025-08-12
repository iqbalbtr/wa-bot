import NodeCache from "@cacheable/node-cache";
import logger from "../../shared/lib/logger";

/**
 * Mengelola dan membatasi jumlah permintaan (request) yang dapat diproses secara bersamaan.
 * Kelas ini juga melacak total permintaan yang telah masuk.
 */
export class RequestLimiter {

    private activeRequests: NodeCache<number> = new NodeCache();
    private readonly concurrencyLimit: number;
    private totalRequestCount: number = 0;
    private readonly requestTimeout: number;
    private readonly logger = logger;

    constructor(limit: number = 10, timeoutMs: number = 30000) {
        this.concurrencyLimit = limit > 0 ? limit : 10;
        this.requestTimeout = timeoutMs;
    }

    /**
     * Memulai pelacakan permintaan baru dari seorang pengguna.
     * @param userId ID unik dari pengguna yang membuat permintaan.
     */
    public startRequest(userId: string): void {
        this.activeRequests.set(userId, Date.now());
        this.totalRequestCount++; // Cukup satu counter untuk total request
    }

    /**
     * Mengakhiri pelacakan permintaan dari seorang pengguna.
     * @param userId ID unik dari pengguna yang permintaannya selesai.
     */
    public endRequest(userId: string): void {
        this.activeRequests.del(userId);
    }

    /**
     * Memeriksa apakah batas permintaan konkuren telah tercapai.
     * @returns `true` jika jumlah permintaan aktif telah mencapai atau melebihi batas.
     */
    public isLimitReached(): boolean {
        return this.activeRequests.keys().length >= this.concurrencyLimit;
    }

    /**
     * Mengembalikan jumlah permintaan yang sedang aktif.
     * @returns Jumlah pengguna yang saat ini aktif.
     */
    public getActiveRequestCount(): number {
        return this.activeRequests.keys().length;
    }

    /**
     * Mengembalikan total jumlah permintaan yang pernah tercatat.
     * @returns Angka total permintaan.
     */
    public getTotalRequestCount(): number {
        return this.totalRequestCount;
    }

    /**
     * Membersihkan permintaan yang sudah terlalu lama (usang/stale) dari daftar aktif.
     * Berguna untuk mencegah kebocoran memori jika `endRequest` tidak terpanggil karena error.
     */
    public cleanupStaleRequests(): void {
        const now = Date.now();
        for (const userId of this.activeRequests.keys()) {
            const timestamp = this.activeRequests.get(userId);
            if (typeof timestamp === "number" && now - timestamp > this.requestTimeout) {
                this.activeRequests.del(userId);
                this.logger.warn(`Removed stale request for user: ${userId}`);
            }
        }
    }
}