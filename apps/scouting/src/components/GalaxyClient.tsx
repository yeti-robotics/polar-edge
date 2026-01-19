"use client";

import Galaxy from "./Galaxy";


export default function GalaxyClient() {
    return (
        <div style={{ width: '100%', height: '600px', position: 'relative' }}>
        <div className="absolute inset-0 -z-10 pointer-events-none"></div>
            <Galaxy />
        </div>
       
    );
 }