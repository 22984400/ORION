// hooks/usePlanification.ts

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Client, ParametresCabinet, EcheanceMensuelle } from '../types/planification';
import { genererEcheancesClient } from '../components/manuel/Planification/utils';

export function usePlanification() {
  const [parametres, setParametres] = useState<ParametresCabinet | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [echeances, setEcheances] = useState<EcheanceMensuelle[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les paramètres et les clients depuis Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // 1. Paramètres
      const { data: params, error: errParams } = await supabase
        .from('parametres_cabinet')
        .select('*')
        .single();
      if (errParams) console.error(errParams);
      else setParametres(params);

      // 2. Clients
      const { data: clientsData, error: errClients } = await supabase
        .from('clients')
        .select('*')
        .order('code_client');
      if (errClients) console.error(errClients);
      else setClients(clientsData || []);

      setLoading(false);
    };
    fetchData();
  }, []);

  // Recalculer les échéances quand les clients ou l'année changent
  useEffect(() => {
    if (!parametres || clients.length === 0) return;
    const annee = parametres.annee;
    const allEcheances = clients.flatMap(client => genererEcheancesClient(client, annee));
    setEcheances(allEcheances);
  }, [clients, parametres]);

  // CRUD clients
  const ajouterClient = async (client: Omit<Client, 'id'>) => {
    const { data, error } = await supabase.from('clients').insert(client).select().single();
    if (error) throw error;
    setClients(prev => [...prev, data]);
    return data;
  };

  const modifierClient = async (id: string, updates: Partial<Client>) => {
    const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select().single();
    if (error) throw error;
    setClients(prev => prev.map(c => c.id === id ? data : c));
    return data;
  };

  const supprimerClient = async (id: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
    setClients(prev => prev.filter(c => c.id !== id));
  };

  // Mettre à jour le suivi d'une échéance (réalisé ou NA)
  const mettreAJourSuivi = async (clientId: string, mois: number, annee: number, champ: string, valeur: any) => {
    // Mettre à jour dans la table `echeances_suivi` (à créer)
    const { error } = await supabase
      .from('echeances_suivi')
      .upsert({
        client_id: clientId,
        mois,
        annee,
        [champ]: valeur,
      });
    if (error) throw error;
    // Mettre à jour le state local
    setEcheances(prev => prev.map(e => {
      if (e.client_id === clientId && e.mois === mois && e.annee === annee) {
        return { ...e, [champ]: valeur };
      }
      return e;
    }));
  };

  return {
    parametres,
    clients,
    echeances,
    loading,
    ajouterClient,
    modifierClient,
    supprimerClient,
    mettreAJourSuivi,
  };
}