
import React from 'react';
import { CrisisResource } from '../types';

const RESOURCES: CrisisResource[] = [
  {
    name: "National Crisis Line",
    contact: "988",
    description: "Available 24/7 for anyone in emotional distress or suicidal crisis.",
    type: "call"
  },
  {
    name: "Crisis Text Line",
    contact: "741741",
    description: "Text HOME to 741741 to connect with a crisis counselor.",
    type: "text"
  },
  {
    name: "Emergency Services",
    contact: "911",
    description: "Immediate assistance for life-threatening emergencies.",
    type: "call"
  },
  {
    name: "The Trevor Project",
    contact: "1-866-488-7386",
    description: "Crisis intervention for LGBTQ youth.",
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
    <div className="p-6 h-full flex flex-col bg-red-50 animate-in fade-in duration-500">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-red-900">Get Help Now</h2>
        <p className="text-red-700 opacity-80">You don't have to go through this alone. Reach out to a professional who can help.</p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto pb-6">
        <div className="bg-red-100 p-4 rounded-2xl border border-red-200">
          <p className="text-xs font-bold text-red-900 uppercase mb-2">Notice</p>
          <p className="text-xs text-red-800">This app is a support tool and not a replacement for professional medical advice or emergency services.</p>
        </div>

        {RESOURCES.map((r, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-red-100 flex flex-col gap-3">
            <div>
              <h3 className="font-bold text-slate-800">{r.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{r.description}</p>
            </div>
            <button 
              onClick={() => handleContact(r)}
              className="w-full bg-red-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <i className={r.type === 'call' ? 'fa-solid fa-phone' : 'fa-solid fa-message'}></i>
              {r.type === 'call' ? 'Call' : 'Text'} {r.contact}
            </button>
          </div>
        ))}
      </div>

      <div className="pt-4 text-center">
        <p className="text-xs text-red-700 italic">"There is hope, even when your brain tells you there isn't."</p>
      </div>
    </div>
  );
};

export default CrisisResources;
