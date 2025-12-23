
import React from 'react';
import { CrisisResource } from '../types';

const RESOURCES: CrisisResource[] = [
  {
    name: "National Emergency Number",
    contact: "112",
    description: "Single emergency number for all services including police and medical emergencies in India.",
    type: "call"
  },
  {
    name: "Kiran Mental Health Helpline",
    contact: "1800-599-0019",
    description: "Government of India's 24/7 toll-free mental health rehabilitation helpline.",
    type: "call"
  },
  {
    name: "Vandrevala Foundation",
    contact: "9999666555",
    description: "24/7 crisis intervention and mental health support via call or WhatsApp.",
    type: "call"
  },
  {
    name: "iCall (TISS)",
    contact: "9152987821",
    description: "Psychosocial helpline run by Tata Institute of Social Sciences. (Mon-Sat, 8am-10pm).",
    type: "call"
  },
  {
    name: "Sneha India",
    contact: "044-24640050",
    description: "24/7 suicide prevention helpline based in Chennai, serving all of India.",
    type: "call"
  }
];

const CrisisResources: React.FC = () => {
  const handleContact = (resource: CrisisResource) => {
    if (resource.type === 'call') {
      window.location.href = `tel:${resource.contact}`;
    } else if (resource.type === 'text') {
      window.location.href = `sms:${resource.contact}`;
    }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-red-50 animate-in fade-in duration-500 scroll-container pb-32">
      <header className="mb-8 pt-6">
        <h2 className="text-2xl font-extrabold text-red-900 tracking-tight">Get Help Now</h2>
        <p className="text-red-700 opacity-80 text-sm mt-2">You don't have to go through this alone. Reach out to verified professional helplines in India.</p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto">
        <div className="bg-red-100/50 p-4 rounded-2xl border border-red-200 backdrop-blur-sm">
          <p className="text-[10px] font-black text-red-900 uppercase tracking-widest mb-1">Important Notice</p>
          <p className="text-xs text-red-800 leading-relaxed">This app is a support tool and not a replacement for professional medical advice or emergency psychiatric services.</p>
        </div>

        {RESOURCES.map((r, i) => (
          <div key={i} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-red-100 flex flex-col gap-4 transition-all hover:shadow-md">
            <div>
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-extrabold text-slate-800 tracking-tight">{r.name}</h3>
                <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full uppercase">Verified</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{r.description}</p>
            </div>
            <button 
              onClick={() => handleContact(r)}
              className="w-full bg-red-500 text-white font-black uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-red-200"
            >
              <i className={r.type === 'call' ? 'fa-solid fa-phone' : 'fa-solid fa-message'}></i>
              {r.type === 'call' ? 'Call' : 'Text'} {r.contact}
            </button>
          </div>
        ))}
      </div>

      <div className="pt-8 text-center">
        <p className="text-[10px] text-red-700 font-bold italic uppercase tracking-wider opacity-60">
          "There is hope, even when your brain tells you there isn't."
        </p>
      </div>
    </div>
  );
};

export default CrisisResources;
