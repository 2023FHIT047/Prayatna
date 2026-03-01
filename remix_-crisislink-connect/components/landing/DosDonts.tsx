
import React, { useRef } from 'react';
import { Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface GuideCardProps {
  title: string;
  image: string;
  dos: string[];
  donts: string[];
}

const GuideCard: React.FC<GuideCardProps> = ({ title, image, dos, donts }) => {
  const { t } = useLanguage();
  return (
    <div className="flex-none w-[300px] md:w-[350px] bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col h-[680px] border border-slate-100 group">
      {/* Hazard Image */}
      <div className="h-52 overflow-hidden relative">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
      </div>

      {/* Institutional Title Bar */}
      <div className="bg-gradient-to-b from-slate-400 to-slate-500 py-3.5 px-4 text-center border-b border-slate-300 shadow-inner">
        <h4 className="text-white font-bold text-lg tracking-tight">{title}</h4>
      </div>

      {/* Content Area */}
      <div className="p-7 flex-grow flex flex-col bg-white">
        {/* Dos List */}
        <ul className="space-y-4 mb-6">
          {dos.map((item, idx) => (
            <li key={idx} className="flex gap-3 items-start">
              <div className="mt-1 shrink-0 w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-white shadow-sm shadow-green-200">
                <Check size={11} strokeWidth={4} />
              </div>
              <span className="text-[13px] font-medium text-slate-800 leading-snug">{item}</span>
            </li>
          ))}
        </ul>

        {/* Separator - Dotted Line */}
        <div className="border-t border-dotted border-slate-400 w-full my-4"></div>

        {/* Donts List */}
        <ul className="space-y-4 mt-4">
          {donts.map((item, idx) => (
            <li key={idx} className="flex gap-3 items-start">
              <div className="mt-1 shrink-0 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white shadow-sm shadow-red-200">
                <X size={11} strokeWidth={4} />
              </div>
              <span className="text-[13px] font-medium text-slate-800 leading-snug">{item}</span>
            </li>
          ))}
        </ul>

        {/* View More Link */}
        <div className="mt-auto pt-6 text-right">
          <button className="text-[13px] font-bold text-[#002147] hover:text-red-600 transition-colors flex items-center justify-end gap-1 ml-auto">
            {t('View More +', 'और देखें +')}
          </button>
        </div>
      </div>
    </div>
  );
};

const DosDonts: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const guides = [
    {
      title: t("Cyclone", "चक्रवात"),
      image: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&q=80&w=800",
      dos: [
        t("Check the house; secure loose tiles and carry out repairs of doors and windows.", "घर की जाँच करें; ढीली टाइलों को सुरक्षित करें और दरवाजों और खिड़कियों की मरम्मत करें।"),
        t("Keep some wooden boards ready so that glass windows can be boarded if needed.", "कुछ लकड़ी के बोर्ड तैयार रखें ताकि जरूरत पड़ने पर कांच की खिड़कियों को बोर्ड किया जा सके।"),
        t("Keep a hurricane lantern filled with kerosene, battery operated torches and enough dry cells.", "मिट्टी के तेल से भरी लालटेन, बैटरी से चलने वाली टॉर्च और पर्याप्त सेल तैयार रखें।")
      ],
      donts: [
        t("DO NOT venture out even when the winds appear to calm down.", "हवाओं के शांत होने पर भी बाहर न निकलें।")
      ]
    },
    {
      title: t("Forest Fire", "वनाग्नि"),
      image: "https://images.unsplash.com/photo-1542332213-31f87348057f?auto=format&fit=crop&q=80&w=800",
      dos: [
        t("Keep emergency contact numbers of district fire service department and local forest authorities handy.", "जिला अग्निशमन विभाग और स्थानीय वन अधिकारियों के आपातकालीन नंबर तैयार रखें।"),
        t("Immediately inform them in case of an unattended or out-of-control fire.", "लावारिस या बेकाबू आग के मामले में उन्हें तुरंत सूचित करें।")
      ],
      donts: [
        t("Do not burn stubble, municipal waste, etc. next to a forest area.", "वन क्षेत्र के पास पराली, नगर निगम का कचरा आदि न जलाएं।"),
        t("Do not burn dry waste in farms close to forest areas.", "वन क्षेत्रों के करीब के खेतों में सूखा कचरा न जलाएं।")
      ]
    },
    {
      title: t("Rainy Season (Floods)", "बरसात का मौसम (बाढ़)"),
      image: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&q=80&w=800",
      dos: [
        t("Listen to radio, watch TV, read newspapers for weather updates.", "मौसम की जानकारी के लिए रेडियो सुनें, टीवी देखें, अखबार पढ़ें।"),
        t("Stay away from electric poles and fallen power lines to avoid electrocution.", "बिजली के झटके से बचने के लिए बिजली के खंभों और गिरे हुए बिजली के तारों से दूर रहें।")
      ],
      donts: [
        t("Do not allow children to play in or near flood waters.", "बच्चों को बाढ़ के पानी में या उसके पास खेलने न दें।"),
        t("Don't use any damaged electrical goods, get them checked.", "किसी भी क्षतिग्रस्त बिजली के सामान का उपयोग न करें, उनकी जांच करवाएं।")
      ]
    },
    {
      title: t("Summer (Heat Wave)", "ग्रीष्मकालीन (लू)"),
      image: "https://images.unsplash.com/photo-1504370805625-d32c54b16100?auto=format&fit=crop&q=80&w=800",
      dos: [
        t("Wear lightweight, light-coloured, loose, cotton clothes.", "हल्के वजन के, हल्के रंग के, ढीले, सूती कपड़े पहनें।"),
        t("Get trained in first aid.", "प्राथमिक चिकित्सा में प्रशिक्षित हों।"),
        t("Stay indoors during extreme heat and use cooling measures properly.", "अत्यधिक गर्मी के दौरान घर के अंदर रहें और शीतलन उपायों का उचित उपयोग करें।")
      ],
      donts: [
        t("Avoid going out in the sun, especially between 12.00 noon and 3.00 p.m.", "धूप में बाहर जाने से बचें, खासकर दोपहर 12.00 बजे से 3.00 बजे के बीच।"),
        t("Avoid strenuous activities when outside in the afternoon.", "दोपहर में बाहर होने पर कठिन गतिविधियों से बचें।")
      ]
    },
    {
        title: t("Earthquake", "भूकंप"),
        image: "https://images.unsplash.com/photo-1531260796528-cdb01c4412a4?auto=format&fit=crop&q=80&w=800",
        dos: [
          t("Drop, Cover, and Hold On immediately under a sturdy piece of furniture.", "किसी मजबूत फर्नीचर के नीचे तुरंत झुकें, ढकें और पकड़ें।"),
          t("Stay away from glass windows and hanging objects.", "कांच की खिड़कियों और लटकती वस्तुओं से दूर रहें।"),
          t("Check yourself and others for injuries once shaking stops.", "कंपन रुकने के बाद खुद की और दूसरों की चोटों की जांच करें।")
        ],
        donts: [
          t("Do not use elevators during or after the earthquake until checked.", "जांच होने तक भूकंप के दौरान या बाद में लिफ्ट का उपयोग न करें।"),
          t("Do not run outside while the ground is still shaking.", "जब जमीन अभी भी हिल रही हो तो बाहर न भागें।")
        ]
      }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-black text-[#002147] tracking-tight">{t("Do's & Don'ts", "क्या करें और क्या न करें")}</h2>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => scroll('left')} 
              className="p-3 bg-white border border-slate-200 text-[#002147] hover:bg-[#002147] hover:text-white transition-all rounded shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => scroll('right')} 
              className="p-3 bg-white border border-slate-200 text-[#002147] hover:bg-[#002147] hover:text-white transition-all rounded shadow-sm"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto no-scrollbar gap-8 pb-10 px-1 scroll-smooth"
        >
          {guides.map((guide, index) => (
            <GuideCard 
              key={index}
              title={guide.title}
              image={guide.image}
              dos={guide.dos}
              donts={guide.donts}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default DosDonts;
