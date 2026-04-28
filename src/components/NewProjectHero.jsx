import React from "react";

export default function NewProjectHero() {
  return (
    <div style={{
      position:"relative",
      borderRadius:"20px",
      overflow:"hidden",
      marginBottom:"20px",
      boxShadow:"0 10px 30px rgba(0,0,0,0.1)"
    }}>
      <img src="/images/solar-hero.jpg" style={{
        width:"100%",
        height:"320px",
        objectFit:"cover"
      }} />

      <div style={{
        position:"absolute",
        inset:0,
        background:"linear-gradient(to right, rgba(255,255,255,0.9), rgba(255,255,255,0.4), transparent)"
      }}/>

      <img src="/images/shil-logo-purple.png" style={{
        position:"absolute",
        top:"20px",
        right:"20px",
        width:"180px",
        opacity:0.35
      }}/>

      <div style={{
        position:"absolute",
        top:"50%",
        transform:"translateY(-50%)",
        left:"30px"
      }}>
        <h2 style={{fontSize:"22px", marginBottom:"10px"}}>
          انرژی پاک، آینده‌ای پایدار
        </h2>
        <p style={{fontSize:"14px", maxWidth:"400px"}}>
          با محصولات SHIL سیستم خورشیدی خود را حرفه‌ای طراحی کنید
        </p>
      </div>
    </div>
  );
}
