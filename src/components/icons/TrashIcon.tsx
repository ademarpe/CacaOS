interface IconProps {
  size?: number;
  className?: string;
}

export function TrashIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 -2 36 36"
      className={className}
    >
      <g transform="translate(2)">
        <g fill="none" strokeMiterlimit="10">
          <path
            d="M23.876,32H8.124A2.193,2.193,0,0,1,6,30.1L2.03,12.651A2.24,2.24,0,0,1,4.154,10H27.846a2.24,2.24,0,0,1,2.124,2.651L26,30.1A2.193,2.193,0,0,1,23.876,32Z"
            stroke="none"
          />
          <path
            d="M 22.3751392364502 28 L 25.56078720092773 14 L 6.439212322235107 14 L 9.624860763549805 28 L 22.3751392364502 28 M 23.87599945068359 32 L 8.12399959564209 32 C 7.072000026702881 32 6.172999858856201 31.19499969482422 6 30.09799957275391 L 2.029999971389771 12.65100002288818 C 1.810999989509583 11.26299953460693 2.822999954223633 10 4.153999805450439 10 L 27.84600067138672 10 C 29.17700004577637 10 30.18899917602539 11.26299953460693 29.96999931335449 12.65100002288818 L 26 30.09799957275391 C 25.82699966430664 31.19499969482422 24.92799949645996 32 23.87599945068359 32 Z"
            stroke="none"
            fill="currentColor"
          />
        </g>
        <rect width="36" height="4" rx="2" transform="translate(-2 2)" fill="currentColor" />
        <path
          d="M2,0H6A2,2,0,0,1,8,2V2A0,0,0,0,1,8,2H0A0,0,0,0,1,0,2V2A2,2,0,0,1,2,0Z"
          transform="translate(12)"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}
