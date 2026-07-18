export default function WaveBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[#b8df51]" />
      <div className="absolute right-[8%] top-[14%] h-16 w-16 rounded-full bg-sun/70 blur-[1px] shadow-[0_0_55px_20px_rgba(255,220,88,0.38)]" />

      <svg
        className="absolute inset-x-0 bottom-0 h-[96vh] w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="paperShadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow
              dx="0"
              dy="12"
              stdDeviation="10"
              floodColor="#075b3b"
              floodOpacity="0.5"
            />
          </filter>
        </defs>

        <g filter="url(#paperShadow)">
          <path
            fill="#b8df51"
            d="M0,0 H1440 V305 C1290,290 1210,218 1085,236 C935,258 870,432 755,508 C652,576 560,456 446,561 C326,674 241,718 138,649 C80,610 38,645 0,702 Z"
          />
          <path
            fill="#94c953"
            d="M0,654 C84,576 153,709 268,622 C384,534 428,436 523,468 C617,499 641,612 728,560 C848,486 879,325 1010,316 C1138,306 1206,388 1312,369 C1372,358 1416,337 1440,326 L1440,900 L0,900 Z"
          />
          <path
            fill="#6daf3d"
            d="M0,724 C104,642 189,719 285,650 C367,592 432,524 529,551 C620,576 661,671 761,606 C887,525 930,372 1039,367 C1153,362 1234,434 1347,438 C1386,440 1418,432 1440,422 L1440,900 L0,900 Z"
          />
          <path
            fill="#2f7d4c"
            d="M0,786 C104,724 205,762 306,706 C412,646 482,649 570,690 C682,744 773,656 869,605 C992,540 1101,612 1217,642 C1309,666 1376,646 1440,611 L1440,900 L0,900 Z"
          />
          <path
            fill="#175d3a"
            d="M0,834 C113,793 205,829 316,789 C432,747 505,695 610,736 C734,784 807,733 915,680 C1042,619 1140,675 1247,720 C1330,754 1397,731 1440,700 L1440,900 L0,900 Z"
          />
        </g>

        <g fill="#174f35" opacity="0.38" transform="translate(95,675)">
          <rect x="0" y="62" width="30" height="88" rx="2" />
          <rect x="36" y="18" width="38" height="132" rx="2" />
          <rect x="80" y="48" width="28" height="102" rx="2" />
          <path d="M116 150 V82 L142 57 L168 82 V150 Z" />
          <path d="M174 150 V45 L195 20 L216 45 V150 Z" />
          <g fill="#b8df51" opacity="0.85">
            <rect x="44" y="32" width="7" height="8" rx="1" />
            <rect x="58" y="32" width="7" height="8" rx="1" />
            <rect x="44" y="49" width="7" height="8" rx="1" />
            <rect x="58" y="49" width="7" height="8" rx="1" />
            <rect x="88" y="62" width="7" height="8" rx="1" />
            <rect x="88" y="79" width="7" height="8" rx="1" />
            <rect x="126" y="96" width="7" height="14" rx="1" />
            <rect x="187" y="62" width="7" height="8" rx="1" />
            <rect x="187" y="80" width="7" height="8" rx="1" />
          </g>
          <g fill="#235e3c">
            <rect x="237" y="91" width="8" height="55" rx="2" />
            <circle cx="241" cy="71" r="25" />
            <rect x="286" y="103" width="7" height="43" rx="2" />
            <circle cx="289" cy="88" r="19" />
            <rect x="328" y="111" width="6" height="35" rx="2" />
            <path d="M331 62 L354 111 H308 Z" />
          </g>
        </g>

        <g stroke="#dcecad" strokeWidth="4" strokeLinecap="round" opacity="0.52" transform="translate(550,690)">
          <line x1="0" y1="0" x2="0" y2="104" />
          <g className="origin-top" transform="translate(0,0)">
            <line x1="0" y1="0" x2="0" y2="-31" />
            <line x1="0" y1="0" x2="27" y2="16" />
            <line x1="0" y1="0" x2="-27" y2="16" />
          </g>
          <line x1="88" y1="35" x2="88" y2="104" strokeWidth="3" />
          <g transform="translate(88,35)" strokeWidth="3">
            <line x1="0" y1="0" x2="0" y2="-23" />
            <line x1="0" y1="0" x2="20" y2="12" />
            <line x1="0" y1="0" x2="-20" y2="12" />
          </g>
        </g>

        <g fill="none" stroke="#ffffff" strokeLinecap="round" opacity="0.28">
          <path d="M-40 640 C110 575 185 696 302 610 C402 537 458 500 538 525" strokeWidth="3" />
          <path d="M842 536 C964 456 1056 435 1162 478 C1258 518 1340 519 1480 465" strokeWidth="3" />
          <path d="M890 588 C1004 531 1102 540 1201 577 C1303 616 1373 609 1470 562" strokeWidth="2" />
        </g>

      </svg>
    </div>
  );
}
