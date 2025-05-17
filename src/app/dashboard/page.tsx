"use client"

import { FileText, AlertCircle, CheckCircle, Clock, TrendingUp, Users, DollarSign } from "lucide-react"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import {Canvas} from "@react-three/fiber"
import { useGLTF, Stage, PresentationControls } from "@react-three/drei"
import { PrimitiveProps } from '@react-three/fiber'
import { ComponentProps } from 'react'
import { useMemo } from 'react'


export default function DashboardPage() {


  function Model(props: PrimitiveProps){
    const {scene} = useGLTF("/honda.glb");
    return <primitive object={scene} {...props}/>
  }




  return (
    <div className="flex flex-col min-h-screen">
      <Navbar activePage="dashboard" />

      <Canvas dpr = {[1,2]} shadows camera = {{fov:45}} style = {{"position": "absolute", width : "500px", height: "500px"}}>
        <color attach="background" args={["#101010"]}></color>
        <PresentationControls speed = {1.5} global zoom = {.9} polar={[-0.1, Math.PI / 4]}>
          <Stage environment={"night"}>
            <Model scale = {0.01}></Model>
          </Stage>
        </PresentationControls>
      </Canvas>

      {/* Dashboard Content */}
      <div className="flex-1 container mx-auto px-4 py-6 md:px-6 md:py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-gray-500">Overview of your insurance claims and analytics</p>
          </div>
          <div className="flex items-center gap-2">
            <select className="p-2 border border-gray-300 rounded-md text-sm" defaultValue="thisMonth">
              <option value="today">Today</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
              <option value="thisYear">This Year</option>
              <option value="allTime">All Time</option>
            </select>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium">Total Claims</div>
              <FileText className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">12%</span> from last month
            </p>
          </div>
          <div className="card p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium">Approved</div>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold">86</div>
            <p className="text-xs text-green-500">67% approval rate</p>
          </div>
          <div className="card p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium">Pending</div>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold">32</div>
            <p className="text-xs text-gray-500">Average 2.4 days to process</p>
          </div>
          <div className="card p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium">Rejected</div>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold">10</div>
            <p className="text-xs text-red-500">7.8% rejection rate</p>
          </div>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="card">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">Claims by Type</h2>
              <p className="text-sm text-gray-500">Distribution of claims by insurance type</p>
            </div>
            <div className="p-4 h-80 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-full max-w-md">
                    {/* Simple visual representation of data */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-100 rounded-full h-4">
                          <div className="bg-blue-500 h-4 rounded-full" style={{ width: "45%" }}></div>
                        </div>
                        <span className="text-xs min-w-[60px]">Auto (45%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-100 rounded-full h-4">
                          <div className="bg-green-500 h-4 rounded-full" style={{ width: "30%" }}></div>
                        </div>
                        <span className="text-xs min-w-[60px]">Home (30%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-100 rounded-full h-4">
                          <div className="bg-amber-500 h-4 rounded-full" style={{ width: "15%" }}></div>
                        </div>
                        <span className="text-xs min-w-[60px]">Health (15%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-100 rounded-full h-4">
                          <div className="bg-purple-500 h-4 rounded-full" style={{ width: "10%" }}></div>
                        </div>
                        <span className="text-xs min-w-[60px]">Life (10%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">Monthly Trends</h2>
              <p className="text-sm text-gray-500">Claims processed over the last 6 months</p>
            </div>
            <div className="p-4 h-80 flex items-center justify-center">
              <div className="text-center text-gray-500 w-full">
                <div className="flex h-60 items-end justify-between gap-2 px-2">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-1 h-full items-end">
                      <div className="w-8 bg-green-200 rounded-t" style={{ height: "60%" }}></div>
                      <div className="w-8 bg-amber-200 rounded-t" style={{ height: "20%" }}></div>
                      <div className="w-8 bg-red-200 rounded-t" style={{ height: "10%" }}></div>
                    </div>
                    <span className="text-xs">Jan</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-1 h-full items-end">
                      <div className="w-8 bg-green-200 rounded-t" style={{ height: "50%" }}></div>
                      <div className="w-8 bg-amber-200 rounded-t" style={{ height: "30%" }}></div>
                      <div className="w-8 bg-red-200 rounded-t" style={{ height: "15%" }}></div>
                    </div>
                    <span className="text-xs">Feb</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-1 h-full items-end">
                      <div className="w-8 bg-green-200 rounded-t" style={{ height: "70%" }}></div>
                      <div className="w-8 bg-amber-200 rounded-t" style={{ height: "20%" }}></div>
                      <div className="w-8 bg-red-200 rounded-t" style={{ height: "5%" }}></div>
                    </div>
                    <span className="text-xs">Mar</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-1 h-full items-end">
                      <div className="w-8 bg-green-200 rounded-t" style={{ height: "65%" }}></div>
                      <div className="w-8 bg-amber-200 rounded-t" style={{ height: "25%" }}></div>
                      <div className="w-8 bg-red-200 rounded-t" style={{ height: "10%" }}></div>
                    </div>
                    <span className="text-xs">Apr</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-1 h-full items-end">
                      <div className="w-8 bg-green-200 rounded-t" style={{ height: "55%" }}></div>
                      <div className="w-8 bg-amber-200 rounded-t" style={{ height: "35%" }}></div>
                      <div className="w-8 bg-red-200 rounded-t" style={{ height: "10%" }}></div>
                    </div>
                    <span className="text-xs">May</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-1 h-full items-end">
                      <div className="w-8 bg-green-200 rounded-t" style={{ height: "75%" }}></div>
                      <div className="w-8 bg-amber-200 rounded-t" style={{ height: "15%" }}></div>
                      <div className="w-8 bg-red-200 rounded-t" style={{ height: "10%" }}></div>
                    </div>
                    <span className="text-xs">Jun</span>
                  </div>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-200 rounded"></div>
                    <span className="text-xs">Approved</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-200 rounded"></div>
                    <span className="text-xs">Pending</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-200 rounded"></div>
                    <span className="text-xs">Rejected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium">Average Claim Value</div>
              <DollarSign className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold">$2,450</div>
            <p className="text-xs text-gray-500">Based on approved claims</p>
          </div>
          <div className="card p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium">Processing Time</div>
              <Clock className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold">2.4 days</div>
            <p className="text-xs text-gray-500">Average time to process</p>
          </div>
          <div className="card p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium">Active Users</div>
              <Users className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-gray-500">Users with active claims</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
