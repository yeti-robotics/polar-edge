"use client";
import React, { useState } from "react";

import {
    Auto,
    TeleopPeroid,
    Endgame
} from './series';

// interface StandFormProps {
//   onSubmit: (data: { standName: string; location: string }) => void;
// }

// const StandForm: React.FC<StandFormProps> = ({ onSubmit }) => {
//   const [standName, setStandName] = useState("");
//   const [location, setLocation] = useState("");

const nextStep = (name?: string) => {
    switch (name) {
        case "auto":
            return <Auto />;
        case "teleop":
            return <TeleopPeroid />;
        case "endgame":
            return <Endgame />;
        default:
            return <div>Default</div>;
    }
}