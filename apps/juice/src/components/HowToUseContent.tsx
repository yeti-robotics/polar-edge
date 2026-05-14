export function HowToUseContent() {
	return (
		<article className="prose prose-sm dark:prose-invert max-w-4xl">
			<h2>How to Use the Battery Analyzer</h2>
			<p>
				The Battery Analyzer helps you understand your robot's electrical
				performance by analyzing Driver Station (DS) logs. Upload your log files
				to see detailed graphs and metrics.
			</p>

			<div className="not-prose flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
				<h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
					Quick Start
				</h3>
				<ol className="ml-4 list-decimal space-y-2 text-sm text-muted-foreground">
					<li>
						Click the <span className="font-medium text-foreground">Analyzer</span>{" "}
						card on the Overview tab
					</li>
					<li>Upload your DS log file (.log or .csv)</li>
					<li>Review the analysis graphs and metrics below</li>
				</ol>
			</div>

			<div className="not-prose flex flex-col gap-6 rounded-lg border border-border bg-card p-6">
				<h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
					Understanding Graph Visuals
				</h3>
				<div className="flex flex-col gap-4">
					<div className="rounded-lg border border-border bg-background p-4">
						<h4 className="mb-2 text-sm font-medium text-foreground">
							What You'll See on the Graphs
						</h4>
						<ul className="ml-4 list-disc space-y-2 text-sm text-muted-foreground">
							<li>
								<strong className="text-foreground">Raw data line:</strong> The actual
								measured values from your log file, showing every sample point
							</li>
							<li>
								<strong className="text-foreground">Rolling window line:</strong> A
								smoothed average over a time window (e.g., 0.10s) that removes
								noise and shows the overall trend
							</li>
							<li>
								<strong className="text-foreground">Rolling min/max:</strong> Shows
								the worst-case values within each window — critical for spotting
								brownouts or current spikes
							</li>
							<li>
								<strong className="text-foreground">Rolling median:</strong> The
								middle value in each window, less affected by extreme outliers than
								the mean
							</li>
							<li>
								<strong className="text-foreground">Regression line:</strong> A
								straight line showing the overall trend (increasing, decreasing,
								or flat) over the entire match
							</li>
							<li>
								<strong className="text-foreground">Scatter points:</strong> Individual
								data points highlighted to show specific events (e.g., current peaks
								above 30A)
							</li>
							<li>
								<strong className="text-foreground">Threshold lines:</strong> Horizontal
								dashed lines marking important limits (e.g., 7V brownout, 120A main
								breaker)
							</li>
							<li>
								<strong className="text-foreground">Phase coloring:</strong> Background
								colors showing match phases —{" "}
								<span className="text-blue-500">blue for Auto</span>,{" "}
								<span className="text-green-500">green for Teleop</span>, gray for
								Disabled
							</li>
						</ul>
					</div>

					<div className="rounded-lg border border-border bg-background p-4">
						<h4 className="mb-2 text-sm font-medium text-foreground">
							Statistical Terms Explained
						</h4>
						<ul className="ml-4 list-disc space-y-2 text-sm text-muted-foreground">
							<li>
								<strong className="text-foreground">Mean (Average):</strong> Sum of all
								values divided by count. Shows the typical performance level.
							</li>
							<li>
								<strong className="text-foreground">Median:</strong> The middle value
								when sorted. Less affected by extreme spikes than mean, better for
								"typical" behavior.
							</li>
							<li>
								<strong className="text-foreground">P90 (90th Percentile):</strong> Value
								that 90% of samples are below. Shows performance under heavy load.
							</li>
							<li>
								<strong className="text-foreground">Rolling Window:</strong> A sliding
								time window that calculates statistics over recent data only. Smooths
								out noise while preserving trends.
							</li>
							<li className="ml-4 list-none text-xs text-muted-foreground">
								<strong className="text-foreground">Example:</strong> Imagine you're
								looking at voltage readings every 0.02 seconds. A 0.10s rolling window
								looks at the last 5 readings (0.10s ÷ 0.02s = 5 samples) and calculates
								the average. As time moves forward, the window "slides" — it drops the
								oldest reading and adds the newest one. This smooths out sudden spikes
								while still showing the overall trend. Think of it like a moving average
								that helps you see the forest through the trees.
							</li>
							<li>
								<strong className="text-foreground">R² (R-squared):</strong> How well
								the regression line fits the data. Closer to 1.0 means a strong trend.
							</li>
						</ul>
					</div>

					<div className="rounded-lg border border-border bg-background p-4">
						<h4 className="mb-2 text-sm font-medium text-foreground">
							How These Relate to Battery Health
						</h4>
						<ul className="ml-4 list-disc space-y-2 text-sm text-muted-foreground">
							<li>
								<strong className="text-foreground">Voltage trends:</strong> A
								declining regression line indicates battery depletion. Steep drops
								suggest weak or damaged batteries.
							</li>
							<li>
								<strong className="text-foreground">Internal resistance (R):</strong> Higher
								resistance means more voltage drop under load. As batteries age,
								resistance increases — shown by rising impedance over time.
							</li>
							<li>
								<strong className="text-foreground">Current spikes:</strong> Frequent
								high-current events stress the battery. More spikes = faster depletion
								and more heat buildup.
							</li>
							<li>
								<strong className="text-foreground">Brownout duration:</strong> Time
								below 7V directly correlates with robot performance loss. Healthy
								batteries should have minimal brownout time.
							</li>
							<li>
								<strong className="text-foreground">Energy used:</strong> Total Wh
								consumed vs. battery capacity (216Wh) shows if you're within safe
								operating limits.
							</li>
						</ul>
					</div>
				</div>
			</div>

			<div className="not-prose flex flex-col gap-6 rounded-lg border border-border bg-card p-6">
				<h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
					Basic Graphs
				</h3>

				<div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-5">
					<h4 className="text-sm font-medium text-foreground">
						Battery Voltage (V)
					</h4>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Shows your battery voltage over the entire match. Healthy batteries
						should stay above 12V. The red line at 7V indicates the brownout
						threshold — if voltage drops below this, the robot will disable
						temporarily.
					</p>
					<div className="ml-4 mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
						<span>
							<strong className="text-foreground">12V threshold:</strong>{" "}
							Nominal operating voltage
						</span>
						<span>
							<strong className="text-foreground">7V threshold:</strong>{" "}
							Brownout point (robot disables)
						</span>
					</div>
				</div>

				<div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-5">
					<h4 className="text-sm font-medium text-foreground">Trip Time (ms)</h4>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Measures how long the roboRIO takes to process each control loop.
						Lower is better. Values above 10ms (yellow line) indicate the code is
						taking too long, which can cause laggy robot response.
					</p>
					<div className="ml-4 mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
						<span>
							<strong className="text-foreground">&lt;5ms:</strong> Excellent
						</span>
						<span>
							<strong className="text-foreground">5-10ms:</strong> Good
						</span>
						<span>
							<strong className="text-foreground">&gt;10ms:</strong> Needs
							optimization
						</span>
					</div>
				</div>

				<div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-5">
					<h4 className="text-sm font-medium text-foreground">Packet Loss (%)</h4>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Shows the percentage of communication packets lost between the Driver
						Station and robot. High packet loss indicates radio or network issues.
					</p>
					<div className="ml-4 mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
						<span>
							<strong className="text-foreground">&lt;1%:</strong> Excellent
						</span>
						<span>
							<strong className="text-foreground">1-5%:</strong> Acceptable
						</span>
						<span>
							<strong className="text-foreground">&gt;5%:</strong> Check radio
							placement and interference
						</span>
					</div>
				</div>

				<div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-5">
					<h4 className="text-sm font-medium text-foreground">
						CAN Utilization (%)
					</h4>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Shows how much of the CAN bus bandwidth is being used. The yellow line
						at 70% indicates high utilization. Values above this may cause
						communication delays with devices.
					</p>
				</div>

				<div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-5">
					<h4 className="text-sm font-medium text-foreground">roboRIO CPU (%)</h4>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Shows the CPU usage of the roboRIO. High CPU usage can cause slow code
						execution and trip time issues.
					</p>
					<div className="ml-4 mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
						<span>
							<strong className="text-foreground">&lt;50%:</strong> Healthy
						</span>
						<span>
							<strong className="text-foreground">50-80%:</strong> Moderate load
						</span>
						<span>
							<strong className="text-foreground">&gt;80%:</strong> High load,
							consider optimization
						</span>
					</div>
				</div>

				<div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-5">
					<h4 className="text-sm font-medium text-foreground">
						Total Current Draw (A)
					</h4>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Shows the total current being drawn from the battery across all PDP
						channels. Spikes indicate high-power moments (e.g., driving hard,
						shooting). Consistently high draw may drain batteries quickly.
					</p>
				</div>

				<div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-5">
					<h4 className="text-sm font-medium text-foreground">
						PDP Channels — Avg / Peak Current
					</h4>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Shows the average and peak current for each Power Distribution Panel
						(PDP) channel. Redder cells indicate higher current draw. Use this to
						identify which motors or devices are drawing the most power.
					</p>
				</div>
			</div>

			<div className="not-prose flex flex-col gap-6 rounded-lg border border-border bg-card p-6">
				<h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
					Advanced Analysis Graphs
				</h3>

				<div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-5">
					<h4 className="text-sm font-medium text-foreground">Voltage Analysis</h4>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Advanced voltage metrics include a rolling minimum (worst-case dip) to
						expose brownout events, and a regression line showing overall depletion
						trend.
					</p>
					<div className="ml-4 mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
						<span>
							<strong className="text-foreground">Min voltage:</strong> Lowest
							single sample recorded
						</span>
						<span>
							<strong className="text-foreground">OCV estimate:</strong> Open-circuit
							voltage estimated from top-3% samples (battery health indicator)
						</span>
						<span>
							<strong className="text-foreground">Mean voltage:</strong> Average
							voltage across the entire match
						</span>
						<span>
							<strong className="text-foreground">&lt;8.5V time:</strong> Time spent
							in motor torque loss zone (reduced performance)
						</span>
						<span>
							<strong className="text-foreground">&lt;6.3V time:</strong> Time spent
							in radio brownout zone (communication loss risk)
						</span>
					</div>
				</div>

				<div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-5">
					<h4 className="text-sm font-medium text-foreground">Current Analysis</h4>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Shows total current draw with local peaks highlighted as scatter points.
						Regression on peaks reveals current demand trends over the match.
					</p>
					<div className="ml-4 mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
						<span>
							<strong className="text-foreground">Peak current:</strong> Highest
							summed current sample
						</span>
						<span>
							<strong className="text-foreground">Mean current:</strong> Average
							current demand
						</span>
						<span>
							<strong className="text-foreground">&gt;120A samples:</strong> Count of
							samples above main breaker threshold (potential breaker trip risk)
						</span>
					</div>
				</div>

				<div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-5">
					<h4 className="text-sm font-medium text-foreground">Power Analysis</h4>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Instantaneous power (P = V × I) calculated from DS log voltage and
						summed current. Regression shows whether power demand trends up or
						remains flat.
					</p>
					<div className="ml-4 mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
						<span>
							<strong className="text-foreground">Peak power:</strong> Highest
							instantaneous power in watts
						</span>
						<span>
							<strong className="text-foreground">Mean power:</strong> Average power
							demand
						</span>
						<span>
							<strong className="text-foreground">Total energy:</strong> Total
							energy used in watt-hours
						</span>
						<span>
							<strong className="text-foreground">% of 216Wh:</strong> Percentage of
							typical FRC battery capacity used
						</span>
					</div>
				</div>

				<div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-5">
					<h4 className="text-sm font-medium text-foreground">Impedance Analysis</h4>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Internal resistance calculated as R = (Voc − V) / I at each current peak
						(I &gt; 15A). Shows battery health and degradation over time.
					</p>
					<div className="ml-4 mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
						<span>
							<strong className="text-foreground">Median R:</strong> Representative
							resistance value
						</span>
						<span>
							<strong className="text-foreground">P90 R:</strong> Resistance under
							heavy current (90th percentile)
						</span>
						<span>
							<strong className="text-foreground">Spike factor:</strong> Ratio of P90
							to median (higher = more resistance variation)
						</span>
						<span>
							<strong className="text-foreground">Est. CCA:</strong> Estimated cold
							cranking amps (7200/R_median empirical formula)
						</span>
						<span>
							<strong className="text-foreground">R samples:</strong> Number of
							current peak samples used for calculation
						</span>
					</div>
				</div>
			</div>

			<div className="not-prose flex flex-col gap-6 rounded-lg border border-border bg-card p-6">
				<h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
					Key Metrics
				</h3>

				<div className="grid gap-3 sm:grid-cols-2">
					<div className="rounded-lg border border-border bg-background p-4">
						<h4 className="mb-1 text-sm font-medium text-foreground">
							Avg / Min Voltage
						</h4>
						<p className="text-xs leading-relaxed text-muted-foreground">
							Average voltage during enabled periods, and the minimum voltage
							reached. Min voltage below 7V triggers brownouts.
						</p>
					</div>

					<div className="rounded-lg border border-border bg-background p-4">
						<h4 className="mb-1 text-sm font-medium text-foreground">
							Brownouts
						</h4>
						<p className="text-xs leading-relaxed text-muted-foreground">
							Number of brownout events and total time spent in brownout. Any
							brownouts indicate power delivery issues.
						</p>
					</div>

					<div className="rounded-lg border border-border bg-background p-4">
						<h4 className="mb-1 text-sm font-medium text-foreground">
							Avg / Max Trip Time
						</h4>
						<p className="text-xs leading-relaxed text-muted-foreground">
							Average and maximum code execution time. High trip times cause
							laggy robot control.
						</p>
					</div>

					<div className="rounded-lg border border-border bg-background p-4">
						<h4 className="mb-1 text-sm font-medium text-foreground">
							Avg / Max Packet Loss
						</h4>
						<p className="text-xs leading-relaxed text-muted-foreground">
							Average and maximum packet loss percentage. High values indicate
							network/radio problems.
						</p>
					</div>

					<div className="rounded-lg border border-border bg-background p-4">
						<h4 className="mb-1 text-sm font-medium text-foreground">
							CAN Utilization
						</h4>
						<p className="text-xs leading-relaxed text-muted-foreground">
							Percentage of CAN bus bandwidth used. Above 70% may cause device
							communication delays.
						</p>
					</div>

					<div className="rounded-lg border border-border bg-background p-4">
						<h4 className="mb-1 text-sm font-medium text-foreground">
							roboRIO CPU
						</h4>
						<p className="text-xs leading-relaxed text-muted-foreground">
							Average CPU usage of the roboRIO. High CPU can slow down code
							execution.
						</p>
					</div>

					<div className="rounded-lg border border-border bg-background p-4">
						<h4 className="mb-1 text-sm font-medium text-foreground">
							Auto / Teleop Time
						</h4>
						<p className="text-xs leading-relaxed text-muted-foreground">
							Time spent in autonomous and teleoperated modes. Helps correlate
							performance with match phases.
						</p>
					</div>

					<div className="rounded-lg border border-border bg-background p-4">
						<h4 className="mb-1 text-sm font-medium text-foreground">
							Phase Bar
						</h4>
						<p className="text-xs leading-relaxed text-muted-foreground">
							Visual breakdown of match phases: <span className="text-blue-500">Auto</span> (blue),{" "}
							<span className="text-green-500">Teleop</span> (green), and{" "}
							<span className="text-muted-foreground">Disabled</span> (gray).
						</p>
					</div>
				</div>
			</div>

			<div className="not-prose flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
				<h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
					Troubleshooting Tips
				</h3>
				<ul className="ml-4 list-disc space-y-2 text-sm text-muted-foreground">
					<li>
						<strong className="text-foreground">Brownouts:</strong> Check battery
						health, reduce current draw, or add more batteries
					</li>
					<li>
						<strong className="text-foreground">High Trip Time:</strong> Optimize
						code, reduce vision processing, or check for blocking operations
					</li>
					<li>
						<strong className="text-foreground">Packet Loss:</strong> Improve radio
						placement, reduce interference, or check cable connections
					</li>
					<li>
						<strong className="text-foreground">High CAN Utilization:</strong> In code,
						reduce the frequency of periodic sensor updates (e.g., send motor
						controller data every 50ms instead of 20ms), combine multiple values into
						single CAN frames, or remove unnecessary status messages. For wiring,
						split devices across multiple CAN buses if your controller supports it,
						or use devices with lower bandwidth requirements
					</li>
					<li>
						<strong className="text-foreground">High CPU:</strong> Profile code,
						reduce vision processing, or optimize algorithms
					</li>
				</ul>
			</div>
		</article>
	);
}
