"use client";
import React, { useState } from "react";

<<<<<<< HEAD
import {
    Auto,
    TeleopPeroid,
    Endgame
} from './pages';
=======
import { Auto } from "./series/AutoPeriod";
import { TeleopPeriod } from "./series/TeleopPeriod";
import { Endgame } from "./series/EndgamePeriod";
>>>>>>> b8a70c3 (commiting very slight changes so that I can go work on the pitform on my computer and not shivangs)

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
<<<<<<< HEAD
            return <TeleopPeroid />;
=======
            return <TeleopPeriod />;
>>>>>>> b8a70c3 (commiting very slight changes so that I can go work on the pitform on my computer and not shivangs)
        case "endgame":
            return <Endgame />;
        default:
            return <div>Default</div>;
    }
}