import React, { useEffect, useState } from "react";
import ForgeReconciler, { Text } from "@forge/react";
import { makeInvoke } from "@forge/bridge";

export const callBackend = makeInvoke();

const App = () => {
	const [data, setData] = useState(null);

	useEffect(() => {
		const run = async () => {
			const result = await callBackend("writeText", {
				example: "Hello from frontend!",
			});
			setData(result);
		};

		run();
	}, []);

	return (
		<>
			<Text>Hello world!</Text>
			<Text>{data ?? "Loading..."}</Text>
		</>
	);
};

ForgeReconciler.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
