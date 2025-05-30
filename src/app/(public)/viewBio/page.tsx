"use client";

import { useState, useEffect, useCallback } from "react";
import MobileScreen from "./dynamic-mobile-screen";
import axiosInstance from "@/helper/axios-instance";
import { useParams } from "next/navigation"; 
import { nanoid } from "nanoid";
import { AlertModal } from '@/components/common/AlertModal';
import UserNotFound from "@/app/user-not-found";
import LoadingSkeleton from "./loading-skeleton";
import ThemeProvider from "@/providers/theme-provider";
import ThemeSwitcher from "@/components/common/theme-switcher";
// import { Metadata } from "next";

import axios from 'axios';

import { BioData } from "@/lib/types";

export default function ViewBio() {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('success');
  const [modalMessage, setModalMessage] = useState('');

  // Função para mostrar o alerta
  const showAlert = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setModalType(type);
    setModalMessage(message);
    setIsModalOpen(true);
  }, []);

  const { slug } = useParams(); // Pegue o slug da URL
  const [bioData, setBioData] = useState<BioData>({
    id: 0,
    name: "",
    biografy: "",
    image: "",
    banner: "",
    content: [],
    form_contact: false,
    copyright: false,
    theme: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      if (!slug) {
        setError("Slug não encontrado na URL.");
        setLoading(false);
        return;
      }
  
      try {
        setLoading(true);
        setError(null); 
        if (!slug) {
          showAlert('error', 'Usuário não encontrado na URL!');
        }

        const profileResponse = await axiosInstance.get(`/api/v1/profile/${slug}/`);
        const profileData = profileResponse.data;
        console.log("Dados recebidos:", profileData);
        // Verificação explícita se os dados são válidos
        if (!profileResponse.data || !profileResponse.data.id) {
        throw new Error("Perfil não encontrado");
        }
          
 
        const theme = profileData.theme ? {
          background_color: profileData.theme.background_color || 'white',
          foreground_color: profileData.theme.foreground_color || 'black',
          font_family: profileData.theme.font_family || 'Arial, sans-serif',
        } : null;


        const links = (profileData.links || []).map((link: any) => ({
          id: nanoid(),
          type: "link" as const,
          content: link.url || "",
          url: link.url || "",
          owner: link.owner || "",
          title: link.title || "",
          og_image: link.og_image || "",
          is_profile_link: link.is_profile_link || false,
          social_network: link.social_network || "",
          username: link.username || "",
          icon: link.icon || "",
          created_at: link.created_at || "",
          updated_at: link.updated_at || "",
        }));
  
        const snaps = (profileData.snaps || []).map((snap: any) => ({
          id: nanoid(),
          type: "photo" as const,
          content: snap.name || "",
          url: snap.image || "",
          small_description: snap.small_description || "",
          updated_at: snap.updated_at || snap.created_at || "",
        }));
  

        // const notes = (profileData.notes || []).map((note: any) => ({
        //   id: note?.id || nanoid(),
        //   type: "note" as const,
        //   content: note?.text || "",
        //   created_at: note?.created_at || new Date().toISOString(),
        //   updated_at: note?.updated_at || new Date().toISOString(),
        //   created: !!note?.id,
        // }));

        const notes = Array.isArray(profileData.notes) 
        ? profileData.notes.map((note: any) => ({
            id: note?.id || nanoid(),
            type: "note" as const,
            content: note?.text || "",
            created_at: note?.created_at || new Date().toISOString(),
            updated_at: note?.updated_at || new Date().toISOString(),
            created: !!note?.id,
          }))
        : [];

        
        
  
        setBioData({
          id: profileData.id,
          name: profileData.name || profileData.full_name || "",
          biografy: profileData.biografy || "",
          image: profileData.image || "",
          banner: profileData.banner || "",
          content: [...links, ...snaps, ...notes], // Agora notes sempre será um array
          form_contact: profileData.form_contact || false,
          copyright: profileData.copyright || false,
          theme: theme ? [theme] : []
        });

        console.log(snaps)
        console.log(links)
        console.log(notes)

        console.log("Resposta completa da API:", profileResponse.data);
        console.log("Notes recebidas da API:", profileResponse.data.notes);

      } catch (err) {
        console.error("Erro na requisição:", err);
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError("Perfil não encontrado");
        } else {
          // Para outros erros, você pode querer tentar novamente ou mostrar mensagem diferente
          setError("Erro ao carregar perfil. Tente recarregar a página.");
        }
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [slug, showAlert]);

  return (
    <>
     {loading ? (
        <LoadingSkeleton />
      ) : error === "Perfil não encontrado" ? ( // Só mostra NotFound para erros 404
        <UserNotFound />
      ) : (

        <div className="flex flex-col lg:flex-row" style={{
          backgroundColor: bioData.theme[0]?.background_color || 'white',
          color: bioData.theme[0]?.foreground_color || 'black',
          fontFamily: bioData.theme[0]?.font_family || 'Arial, sans-serif',
        }}>
          {error ? (
             <UserNotFound></UserNotFound>
          ) : (
            <ThemeProvider 
            attribute="class"
            defaultTheme="system"
            enableSystem>
              <div className="w-full  py-5 ">
                <div className="fixed z-50 right-4 top-24">
                  <ThemeSwitcher />
                </div>
                <div className="w-full flex justify-center">
                <MobileScreen bioData={bioData} />
                </div>
              </div>
           </ThemeProvider>
          )}
          <AlertModal
            type={modalType}
            message={modalMessage}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        </div>
      )}
    </>

  );
}