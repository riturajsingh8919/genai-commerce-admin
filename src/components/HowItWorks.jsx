"use client";

import Image from "next/image";
import Link from "next/link";
import { FaChevronRight } from "react-icons/fa";
import { motion } from "framer-motion";
import Calendar from "./ui/Calendar";
import Biomarkers from "./ui/Biomarkers";
import Recommendations from "./ui/Recommendations";

const steps = [
  {
    step: "Step 1",
    title: "Establish your baseline:",
    description:
      "Upload your existing lab work or schedule a comprehensive diagnostic panel with us.",
    component: <Calendar />,
  },
  {
    step: "Step 2",
    title: "Decode your data:",
    description:
      "Our proprietary AI analyzes hundreds of biomarkers and gives you a clear breakdown of exactly what is happening inside your body.",
    component: <Biomarkers />,
  },
  {
    step: "Step 3",
    title: "Optimize and repeat:",
    description:
      "Follow a personalized plan for nutrition, supplements, and lifestyle. Re-test, further optimize, and watch your biological trends improve over time.",
    component: <Recommendations />,
  },
];

const HowItWorks = () => {
  return (
    <section className="bg-[#000d24] py-20 font-sans">
      <div className="container mx-auto px-4 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6"
        >
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
              How it works
            </h2>
          </div>
          <Link
            href={"/how-it-works"}
            className="bg-[#0027ED] text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-[#002e7d] transition-colors flex items-center gap-2"
          >
            Learn more{" "}
            <span className="text-xl">
              <FaChevronRight className="text-sm" />
            </span>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="flex flex-col"
            >
              <div className="relative w-full aspect-4/3 mb-8 overflow-visible rounded-2xl group">
                {item.component ? (
                  <div className="w-full h-full p-1">
                    <motion.div
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.3 }}
                      className="w-full h-full"
                    >
                      {item.component}
                    </motion.div>
                  </div>
                ) : (
                  <div className="relative w-full h-full rounded-2xl overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-4">
                <span className="inline-block bg-[#0027ED] text-white text-sm font-medium px-4 py-1.5 rounded-full w-fit">
                  {item.step}
                </span>
                <h3 className="text-2xl font-light text-white">{item.title}</h3>
                <p className="text-[#aeacaf] text-base leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
