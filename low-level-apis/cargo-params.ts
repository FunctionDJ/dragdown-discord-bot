export interface CargoParams {
	tables: string[];
	/** this is readonly to allow passing "as const" arrays */
	fields: readonly string[];
	where?: string;
	limit?: number;
}
