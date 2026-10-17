// Official Murang'a County coat of arms, served from /public/logo.png.
export default function Logo({ height = 60 }) {
  return <img src="/logo.png" alt="Murang'a County Government coat of arms" style={{ height, width: "auto" }} />;
}
