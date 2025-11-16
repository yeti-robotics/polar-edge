import { cn } from "@repo/ui/lib/utils";

//2021 Infinite Recharge Field Diagram (SVG)
//this is a simplified representation of the 2021 field
//showing the Power Port (goal) with its three scoring zones as a SVG image
export function InfiniteRechargeDiagram({ className }: { className?: string }) { //this is the function that is exported to the form
    return (
        <svg
            className={cn(className)}
            width="100%"
            height="auto"
            viewBox="0 0 300 400"
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg" //this is the namespace for the SVG image
        >
            <rect width="300" height="400" fill="#2a2a2a" />
            <rect
                x="10"
                y="10"
                width="280"
                height="380"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2" />

            <g transform="translate(150, 200)">
                <rect
                    x="-60"
                    y="60"
                    width="120"
                    height="40"
                    fill="#6b7280"
                    stroke="#dc2626"
                    strokeWidth="2" />
                <text
                    x="0"
                    y="85"
                    textAnchor="middle"
                    fill="#fbbf24"
                    fontSize="14"
                    fontWeight="bold"
                >
                    LOWER
                </text>

                {/* Outer Port (ring) setup */}
                <circle
                    cx="0"
                    cy="0"
                    r="60"
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="4"
                />
                <text
                    x="0"
                    y="5"
                    textAnchor="middle"
                    fill="#fbbf24"
                    fontSize="14"
                    fontWeight="bold"
                >
                    OUTER
                </text>

                {/* Inner Port (small center) setup */}
                <circle
                    cx="0"
                    cy="0"
                    r="25"
                    fill="#6b7280"
                    stroke="#fbbf24"
                    strokeWidth="3"
                />
                <text
                    x="0"
                    y="-10"
                    textAnchor="middle"
                    fill="#dc2626"
                    fontSize="12"
                    fontWeight="bold"
                >
                    INNER
                </text>
            </g>

            {/* Title of section */}
            <text
                x="150"
                y="35"
                textAnchor="middle"
                fill="#dc2626"
                fontSize="18"
                fontWeight="bold"
            >
                POWER PORT
            </text>

            {/* Legend for organization and readability */}
            <g transform="translate(20, 350)">
                <text fill="#fbbf24" fontSize="10">
                    Inner: 3pts (A) / 2pts (T)
                </text>
            </g>
            <g transform="translate(20, 365)">
                <text fill="#fbbf24" fontSize="10">
                    Outer: 2pts (A) / 1pts (T)
                </text>
            </g>
            <g transform="translate(20, 380)">
                <text fill="#fbbf24" fontSize="10">
                    Lower: 1pt (A) / 1pt (T)
                </text>
            </g>
        </svg>
    );
}

