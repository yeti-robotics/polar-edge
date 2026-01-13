"use client";
import { useState } from "react";

function PitForm() {
    const frontend = {
            1: "This is a frontend only form."
    }     
    return (
        <div>
            <form>
                <div className="flex flex-col gap-1">
  <label
    htmlFor="width"
    className="text-sm font-medium text-muted-foreground"
  >
    Width:
  </label>

  <input
    type="number"
    id="width"
    name="width"
    placeholder="Enter width"
    className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
  />
  <label
    htmlFor="length"
    className="text-sm font-medium text-muted-foreground"
  >
    Length:
  </label>

  <input
    type="number"
    id="length"
    name="length"
    placeholder="Enter length"
    className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
  />
  <label
    htmlFor="height"
    className="text-sm font-medium text-muted-foreground"
  >
    Height
  </label>

  <input
    type="number"
    id="height"
    name="height"
    placeholder="Enter height"
    className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
  />
  <label
    htmlFor="weight"
    className="text-sm font-medium text-muted-foreground"
  >
    Weight:
  </label>

  <input
    type="number"
    id="weight"
    name="weight"
    placeholder="Enter weight"
    className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
  />
</div>
<hr/>
<h1 className="bg-gray-500 text-white"> Scoring Capabilities 'Since doing late and school I will look at this tmr'</h1>

<label
  htmlFor="scoring-capabilities"
  className="text-sm font-medium text-muted-foreground"
>
  Scoring Capabilities:
</label>

<input
  type="text"
  id="scoring-capabilities"
  name="scoring-capabilities"
  placeholder="Enter scoring capabilities"
  className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
/>
<br/>
<h1> Climb level </h1> 
<hr/>
<br/>

<label> L1 </label><input type="checkbox" id="Climb" name="Climb" />
<label> L2 </label><input type="checkbox" id="Climb" name="Climb" />
<label> L3 </label><input type="checkbox" id="Climb" name="Climb" />
<hr/>
<br/>

<h1 className="text-gray-300 text-2xl"> Robot Build </h1>
<br/>
<label> Bump </label><input type="checkbox" id="Bump" name="Bump" />
<label> Trench </label><input type="checkbox" id="Trench" name="Trench" />
<hr/>
<br/>

            </form>



        </div>



    )
    


}

export default PitForm;
