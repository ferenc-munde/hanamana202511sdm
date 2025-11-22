import { makeInvoke } from "@forge/bridge";
import ForgeReconciler, { Badge, Button, DynamicTable, Stack, Text, Strong, Box, Inline, DatePicker, User } from "@forge/react";
import React, { useEffect, useState } from "react";

export const callBackend = makeInvoke();

/**
 * Main Overtime Calculator Component
 * - Only fetches users who have JTTP data (getEmployeeOvertimeData)
 * - Increased spacing and table padding to improve appearance
 */
const App = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);

    // Date range state - default to start of year until today
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const [startDate, setStartDate] = useState(startOfYear.toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(now.toISOString().split("T")[0]);

    useEffect(() => {
        // Debounce to prevent excessive API calls when both dates are changed
        const timeoutId = setTimeout(() => {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const employeeData = await callBackend("getEmployeeOvertimeData", { startDate, endDate });
                    setEmployees(employeeData || []);
                } catch (err) {
                    console.error("Error fetching overtime data:", err);
                    setEmployees([]);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [startDate, endDate]);

    const formatHours = (hours) => {
        if (hours === null || hours === undefined) return "0.0h";
        return `${hours.toFixed(1)}h`;
    };

    const exportToCSV = () => {
        if (!employees || employees.length === 0) {
            console.warn("No data to export");
            return;
        }

        // Create CSV header
        const headers = ["Employee", "Worked Hours", "Required Hours", "Daily Hours", "Overtime"];

        // Create CSV rows
        const csvRows = employees.map(employee => {
            return [
                employee.name || "Unknown",
                employee.totalHours?.toFixed(1) || "0.0",
                employee.requiredHours?.toFixed(1) || "0.0",
                "8.0",
                employee.overtime?.toFixed(1) || "0.0"
            ].join(",");
        });

        // Combine header and rows
        const csvContent = [headers.join(","), ...csvRows].join("\n");

        // Create blob and download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", `overtime_report_${startDate}_to_${endDate}.csv`);
        link.style.visibility = "hidden";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const head = {
        cells: [
            { key: "employee", content: "Employee", width: 25 },
            { key: "workedHours", content: "Worked Hours", width: 15 },
            { key: "requiredHours", content: "Required", width: 15 },
            { key: "dailyHours", content: "Daily Hours", width: 15 },
            { key: "overtime", content: "Overtime", width: 15 },
        ],
    };

    const rows = employees.map((employee) => ({
        key: employee.id,
        cells: [
            {
                key: "employee",
                content: (
                    <Inline>
                        <Box>
                            <User accountId={employee.id}></User>
                        </Box>
                    </Inline>
                ),
            },
            { key: "workedHours", content: <Box padding="space.100"><Text>{formatHours(employee.totalHours)}</Text></Box> },
            { key: "requiredHours", content: <Box padding="space.100"><Text>{formatHours(employee.requiredHours)}</Text></Box> },
            { key: "dailyHours", content: <Box padding="space.100"><Text>8.0h</Text></Box> },
            {
                key: "overtime",
                content: (
                    <Box padding="space.100">
                        <Text>{formatHours(employee.overtime)}</Text>
                    </Box>
                ),
            },
        ],
    }));

    return (
        <Stack space="space.600">
            {/* Date Range Filters - Start and End on opposite sides */}
            <Inline spread="space-between" alignBlock="start">
                <Box>
                    <Stack space="space.100">
                        <Text weight="bold">Start Date</Text>
                        <DatePicker
                            value={startDate}
                            onChange={(newDate) => setStartDate(newDate)}
                        />
                        <Button
                            appearance="default"
                            onClick={exportToCSV}
                            style={{
                                border: "1px solid black",
                                borderRadius: "4px",
                                color: "black",
                                backgroundColor: "white"
                            }}
                        >
                            Export to CSV
                        </Button>
                    </Stack>
                </Box>
                <Box>
                    <Stack space="space.100">
                        <Text weight="bold">End Date</Text>
                        <DatePicker
                            value={endDate}
                            onChange={(newDate) => setEndDate(newDate)}
                        />
                    </Stack>
                </Box>
            </Inline>

            {/* Table */}
            <Box padding="space.200">
                <DynamicTable
                    head={head}
                    rows={rows}
                    isLoading={loading}
                    emptyView={<Text>No employee worklog data available. Please check API connection.</Text>}
                />
            </Box>
        </Stack>
    );
};

ForgeReconciler.render(<App />);