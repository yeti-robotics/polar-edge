"use client";

import { useState } from "react";
import PitForm from "@/components/PitForms";

function FrontendOnlyForm() {
    const frontend = {
            1: "This is a frontend only form."
        }

    return(

        <div>
            <PitForm/>
                

        </div>
    )
}

export default FrontendOnlyForm;