import { z, type ZodObject } from "zod";
import { cargoExport, type sanitizeFunction } from "./cargo-export";

/**
 * derives fields from zod schema.
 * probably not compatible with anything other than single-table queries
 * (i.e. no JOINs).
 */
export const cargoExportValidate = async <Schema extends ZodObject>({
	tables,
	rowSchema,
	where,
	limit,
	orderBy,
}: {
	tables: string[];
	rowSchema: Schema;
	where?: (sanitize: typeof sanitizeFunction) => string;
	limit?: number;
	orderBy?: string;
}) => {
	const response = await cargoExport({
		tables,
		fields: Object.keys(rowSchema.shape),
		where,
		limit,
		orderBy,
	});

	return z.array(rowSchema).parse(response);
};
