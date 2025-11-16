"use client";
import { type ChartConfig } from "@repo/ui/components/chart";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis } from "recharts";

const chartData = [
    { level: "level1", game1: 5, game2: 7, game3: 3 },
    { level: "level2", game1: 4, game2: 3, game3: 7 },
    { level: "level3", game1: 6, game2: 4, game3: 5 },
    { level: "level4", game1: 3, game2: 6, game3: 4 },
    { total: "Total", game1: 18, game2: 20, game3: 19 },

];

const chartData2 = [
    { level: "level1", game1: 6, game2: 5, game3: 4 },
    { level: "level2", game1: 5, game2: 4, game3: 6 },
    { level: "level3", game1: 4, game2: 6, game3: 5 },
    { level: "level4", game1: 7, game2: 3, game3: 4 },
    { total: "Total", game1: 22, game2: 18, game3: 19 },

];

const gameColors = {
    game1: {
        label: "game 1",
        color: "#2563eb",
    },
    game2: {
        label: "game 2",
        color: "#60a5fa",
    },
    game3: {
        label: "game 3",
        color: "#3b82f6",
    },
} satisfies ChartConfig;

const gameColors2 = {
    game1: {
        label: "game 1",
        color: "#d97706",
    },
    game2: {
        label: "game 2",
        color: "#fbbf24",
    },
    game3: {
        label: "game 3",
        color: "#f59e0b",
    },
} satisfies ChartConfig;

export function ChartComparison() {
    return (
        <ResponsiveContainer width="25%" height={100}>
            <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <Tooltip />
                <Legend />
                <Bar dataKey="game1" stackId="a" fill={gameColors.game1.color} name="Game 1" />
                <Bar dataKey="game2" stackId="a" fill={gameColors.game2.color} name="Game 2" />
                <Bar dataKey="game3" stackId="a" fill={gameColors.game3.color} name="Game 3" />
            </BarChart>
        </ResponsiveContainer>
    );
}

export function ChartComparisonTwo() {
    return (
        <ResponsiveContainer width="25%" height={100}>
            <BarChart data={chartData2}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <Tooltip />
                <Legend />
                <Bar dataKey="game1" stackId="a" fill={gameColors2.game1.color} name="Game 1" />
                <Bar dataKey="game2" stackId="a" fill={gameColors2.game2.color} name="Game 2" />
                <Bar dataKey="game3" stackId="a" fill={gameColors2.game3.color} name="Game 3" />
            </BarChart>
        </ResponsiveContainer>
    );
}


