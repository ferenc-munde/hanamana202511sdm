import { makeInvoke } from "@forge/bridge";
import ForgeReconciler, { Badge, Button, DynamicTable, Stack, Text, Strong, Box, Inline, DatePicker, User, Textfield } from "@forge/react";
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

    // Editing state for daily hours
    const [editingUserId, setEditingUserId] = useState(null);
    const [editingValue, setEditingValue] = useState("");
    const [savingUserId, setSavingUserId] = useState(null);

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

    const handleEditDailyHours = (userId, currentDailyHours) => {
        setEditingUserId(userId);
        setEditingValue(currentDailyHours.toString());
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
        setEditingValue("");
    };

    const handleSaveDailyHours = async (userId) => {
        try {
            setSavingUserId(userId);
            const newDailyHours = parseFloat(editingValue);

            if (isNaN(newDailyHours) || newDailyHours <= 0) {
                console.error("Invalid daily hours value");
                return;
            }

            // Call backend to update daily hours and get recalculated data
            const updatedEmployee = await callBackend("updateEmployeeDailyHours", {
                userId,
                dailyHours: newDailyHours,
                startDate,
                endDate,
            });

            if (updatedEmployee) {
                // Update the employees array with the new data
                setEmployees((prevEmployees) =>
                    prevEmployees.map((emp) =>
                        emp.id === userId ? updatedEmployee : emp
                    )
                );
            }

            // Clear editing state
            setEditingUserId(null);
            setEditingValue("");
        } catch (error) {
            console.error("Error saving daily hours:", error);
        } finally {
            setSavingUserId(null);
        }
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
            const dailyHours = employee.customDailyHours || 8;
            return [
                employee.name || "Unknown",
                employee.totalHours?.toFixed(1) || "0.0",
                employee.requiredHours?.toFixed(1) || "0.0",
                dailyHours.toFixed(1),
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

    const rows = employees.map((employee) => {
        const isEditing = editingUserId === employee.id;
        const isSaving = savingUserId === employee.id;
        const dailyHours = employee.customDailyHours || 8;

        return {
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
                {
                    key: "dailyHours",
                    content: (
                        <Box padding="space.100">
                            {isEditing ? (
                                <Inline space="space.100" alignBlock="center">
                                    <Textfield
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        placeholder="Daily hours"
                                        type="number"
                                        width="xsmall"
                                        isDisabled={isSaving}
                                    />
                                    <Button
                                        appearance="primary"
                                        onClick={() => handleSaveDailyHours(employee.id)}
                                        isDisabled={isSaving}
                                    >
                                        {isSaving ? "Saving..." : "Save"}
                                    </Button>
                                    <Button
                                        appearance="subtle"
                                        onClick={handleCancelEdit}
                                        isDisabled={isSaving}
                                    >
                                        Cancel
                                    </Button>
                                </Inline>
                            ) : (
                                <Inline space="space.100" alignBlock="center">
                                    <Text>{dailyHours}h</Text>
                                    <Button
                                        appearance="primary"
                                        onClick={() => handleEditDailyHours(employee.id, dailyHours)}
                                        spacing="compact"
                                    >
                                        Edit
                                    </Button>
                                </Inline>
                            )}
                        </Box>
                    ),
                },
                {
                    key: "overtime",
                    content: (
                        <Box padding="space.100">
                            <Text>{formatHours(employee.overtime)}</Text>
                        </Box>
                    ),
                },
            ],
        };
    });

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
                            appearance="warning"
                            onClick={exportToCSV}
                            style={{
                                border: "1px solid black",
                                borderRadius: "4px",
                                color: "black",
                                backgroundColor: "green"
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