"use client";

import Folder from "@/components/Folder";


function OutReachPage() {
    return (
        <section className="ml-10 mt-10">
        <div className="flex justify-center p-4 justify-content: right;">
             
      <section className="ml-10 mt-10">
        <Folder
          color="#2c2d33ff"
          folderBackColor="#232325ff"
          paper1="#ffffffff"
          paper2="#f0f0f0ff"
          paper3="#000000ff"
          papers={["Paper 1", "Paper 2", "Paper 3"]}
        />
        <br/>
        <br/>
        <br/>
        <Folder
          color="#2c2d33ff"
          folderBackColor="#232325ff"
          paper1="#ffffffff"
          paper2="#f0f0f0ff"
          paper3="#000000ff"
          papers={["Paper 1", "Paper 2", "Paper 3"]}
        />
        <br/>
        <br/>
        <br/>
        <Folder
          color="#2c2d33ff"
          folderBackColor="#232325ff"
          paper1="#474646ff"
          paper2="#6d6a6aff"
          paper3="#aea9a9ff"
          papers={["Paper 1", "Paper 2", "Paper 3"]}
        />
        <br/>
        <br/>
      </section>
      </div>
      </section> 


    )
}



export default OutReachPage;