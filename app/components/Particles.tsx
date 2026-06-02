'use client'

const PARTICLES = [
  { size: 6,  top: '8%',  left: '12%', delay: '0s',    duration: '6s'  },
  { size: 4,  top: '15%', left: '78%', delay: '1.2s',  duration: '8s'  },
  { size: 8,  top: '30%', left: '5%',  delay: '0.5s',  duration: '7s'  },
  { size: 3,  top: '45%', left: '90%', delay: '2s',    duration: '9s'  },
  { size: 5,  top: '60%', left: '20%', delay: '1.8s',  duration: '6.5s'},
  { size: 7,  top: '70%', left: '65%', delay: '0.3s',  duration: '8.5s'},
  { size: 4,  top: '80%', left: '40%', delay: '1s',    duration: '7.5s'},
  { size: 3,  top: '20%', left: '50%', delay: '2.5s',  duration: '10s' },
  { size: 5,  top: '55%', left: '82%', delay: '0.8s',  duration: '6s'  },
  { size: 6,  top: '88%', left: '10%', delay: '1.5s',  duration: '9s'  },
  { size: 3,  top: '35%', left: '35%', delay: '3s',    duration: '7s'  },
  { size: 4,  top: '92%', left: '72%', delay: '0.2s',  duration: '8s'  },
]

export default function Particles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.4; }
          33%       { transform: translateY(-18px) rotate(60deg); opacity: 0.7; }
          66%       { transform: translateY(-8px) rotate(120deg); opacity: 0.5; }
        }
      `}</style>
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: p.size,
            height: p.size,
            top: p.top,
            left: p.left,
            animation: `float ${p.duration} ${p.delay} ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  )
}
