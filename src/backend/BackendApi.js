import { makeResolver } from "@forge/resolver";
import { backendService } from "./BackendService";

export const resolver = makeResolver({
	writeText(request) {
		const { example } = request.payload;
		return backendService.getText(example);
	},

	/**
	 * Get employee overtime data (async)
	 * Accepts optional date range from frontend
	 */
	async getEmployeeOvertimeData(request) {
		const { startDate, endDate } = request.payload || {};
		return await backendService.getEmployeeOvertimeData(startDate, endDate);
	},

	/**
	 * Get overtime summary statistics (async)
	 */
	async getOvertimeSummary() {
		return await backendService.getOvertimeSummary();
	},
});

export const handler = resolver;