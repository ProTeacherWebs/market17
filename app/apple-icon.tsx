import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0E1014",
          borderRadius: 40,
        }}
      >
        <svg width="108" height="108" viewBox="0 0 32 32" fill="none">
          <path
            fill="#F4F5F7"
            d="M18.7 5.5 9.4 17.35h5.05L11.3 26.5l11.3-13.05h-5.2L21.1 5.5H18.7Z"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
