"use client";
import Snowfall from "react-snowfall";

export function SnowfallComponent() {
	return (
		<Snowfall
			style={{
				position: "fixed",
				width: "100vw",
				height: "100vh",
				zIndex: 0,
				pointerEvents: "none",
			}}
			snowflakeCount={200}
		/>
	);
}
