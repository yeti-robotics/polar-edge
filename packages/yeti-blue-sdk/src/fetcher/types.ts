export interface CacheMetadata {
	etag?: string;
	maxAge?: number;
	timestamp: number;
}

export interface CachedResponse<T> {
	value: T;
	metadata: CacheMetadata;
}

export interface FetcherOptions {
	etag?: string;
	cache?: boolean;
}

export interface FetcherResponse<T> {
	data: T;
	status: number;
	etag?: string;
	maxAge?: number;
}
