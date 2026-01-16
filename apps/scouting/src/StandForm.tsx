"use client";
import React, { useState } from "react";

import { Auto } from "./series/AutoPeriod";
import { TeleopPeriod } from "./series/TeleopPeriod";
import { Endgame } from "./series/EndgamePeriod";

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
            return <TeleopPeriod />;
        case "endgame":
            return <Endgame />;
        default:
            return <div>Default</div>;
    }
}