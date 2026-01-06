import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  BookOpen, 
  CheckCircle2, 
  Music, 
  Smartphone, 
  Cloud, 
  HelpCircle,
  MessageSquare
} from 'lucide-react';

const HelpPage: React.FC = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: <BookOpen className="text-blue" />,
      title: 'Estudo dos Capítulos',
      content: 'Navegue pelos capítulos na ordem ou escolha o que mais lhe interessa. Cada capítulo contém páginas de leitura e áudio opcional.'
    },
    {
      icon: <Music className="text-purple" />,
      title: 'Player de Áudio',
      content: 'Você pode ouvir o conteúdo dos capítulos. O player suporta ajuste de velocidade e funciona offline após o primeiro carregamento.'
    },
    {
      icon: <MessageSquare className="text-orange" />,
      title: 'Questões de Estudo',
      content: 'Ao final de cada capítulo, responda às questões para consolidar o conhecimento. Suas respostas são salvas automaticamente.'
    },
    {
      icon: <CheckCircle2 className="text-green" />,
      title: 'Progresso',
      content: 'O aplicativo acompanha quais páginas você leu, quais áudios ouviu e quais questões respondeu para marcar o capítulo como concluído.'
    },
    {
      icon: <Cloud className="text-cyan" />,
      title: 'Sincronização',
      content: 'Seus dados são salvos localmente primeiro. Quando houver conexão, eles serão sincronizados com sua conta automaticamente.'
    },
    {
      icon: <Smartphone className="text-pink" />,
      title: 'Dica de Uso (PWA)',
      content: 'Para uma melhor experiência, adicione este aplicativo à sua tela inicial através do menu de compartilhamento do seu navegador.'
    }
  ];

  return (
    <div className="help-page-layout">
      <header className="glass detail-header">
        <div className="back-and-status">
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            <ChevronLeft size={24} />
          </button>
        </div>
        <div className="header-title">
          <span>Guia do Usuário</span>
          <h2>Como usar o App</h2>
        </div>
        <div style={{ width: 48 }}></div> {/* Spacer for symmetry */}
      </header>

      <main className="help-content-container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="help-intro card glass"
        >
          <HelpCircle size={48} className="help-icon-main" />
          <h3>Bem-vindo ao Estudos Eventos Finais</h3>
          <p>
            Este aplicativo foi desenvolvido para auxiliar no seu estudo bíblico sobre os eventos finais. 
            Veja abaixo como aproveitar ao máximo todos os recursos disponíveis.
          </p>
        </motion.div>

        <div className="help-grid">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="help-card card glass"
            >
              <div className="help-card-icon">{section.icon}</div>
              <h4>{section.title}</h4>
              <p>{section.content}</p>
            </motion.div>
          ))}
        </div>

        <div className="help-footer">
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Entendi, ir para o Dashboard
          </button>
          <p className="author-disclaimer">
            Autor: Com carinho Paulo Griietner
          </p>
        </div>
      </main>
    </div>
  );
};

export default HelpPage;
