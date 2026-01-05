import * as React from "react";

const Logo = ({ className }: { className?: string }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		className={className}
		fill="currentColor"
		viewBox="0 0 32 22"
	>
		<path d="M0 0h32l-1.665 2.963H2.246z"></path>
		<path d="m11.862 1.186 3.756 1.216-7.386 18.574-3.948-.119zM27.728 7.356l2.607-4.393H25.44L23.1 7.77a1 1 0 0 1-.899.562H14.54l-1.188 2.93h9.332a5 5 0 0 0 4.468-2.758z"></path>
		<g>
			<path
				fill="url(#paint0_linear_135_7)"
				d="m14.683 4.741.666-1.778h10.097l-.882 1.778z"
			></path>
		</g>
		<defs>
			<linearGradient
				id="paint0_linear_135_7"
				x1="14.683"
				x2="25.446"
				y1="3.852"
				y2="3.852"
				gradientUnits="userSpaceOnUse"
			>
				<stop stopColor="color(display-p3 0.3373 0.7176 0.9059)"></stop>
				<stop
					offset="1"
					stopColor="color(display-p3 0.2666 0.6039 0.7708)"
				></stop>
			</linearGradient>
			<filter
				id="filter0_d_135_7"
				width="18.763"
				height="9.778"
				x="10.683"
				y="2.963"
				colorInterpolationFilters="sRGB"
				filterUnits="userSpaceOnUse"
			>
				<feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
				<feColorMatrix
					in="SourceAlpha"
					result="hardAlpha"
					values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
				></feColorMatrix>
				<feOffset dy="4"></feOffset>
				<feGaussianBlur stdDeviation="2"></feGaussianBlur>
				<feComposite in2="hardAlpha" operator="out"></feComposite>
				<feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"></feColorMatrix>
				<feBlend
					in2="BackgroundImageFix"
					result="effect1_dropShadow_135_7"
				></feBlend>
				<feBlend
					in="SourceGraphic"
					in2="effect1_dropShadow_135_7"
					result="shape"
				></feBlend>
			</filter>
		</defs>
	</svg>
);

export default Logo;
