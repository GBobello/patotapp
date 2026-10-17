import type { Metadata } from "next";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { LinkButton } from "@/components/links";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Como o PatotApp coleta, usa e protege seus dados (LGPD).",
};

const UPDATED_AT = "17 de outubro de 2026";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <Stack component="section" aria-labelledby={id} spacing={1}>
      <Typography id={id} variant="h6" component="h2">
        {title}
      </Typography>
      {children}
    </Stack>
  );
}

/** RNF20 (LGPD): política de privacidade pública, acessível sem login. */
export default function PrivacyPage() {
  return (
    <Container component="main" maxWidth="md" sx={{ py: { xs: 3, sm: 6 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Stack spacing={3}>
          <div>
            <Typography variant="h4" component="h1">
              Política de privacidade
            </Typography>
            <Typography color="text.secondary">Última atualização: {UPDATED_AT}</Typography>
          </div>

          <Typography>
            O PatotApp é um aplicativo gratuito, criado num projeto de extensão universitária, para organizar patotas de
            futebol. Esta página explica, em linguagem simples, quais dados guardamos, para quê e quem pode vê-los, de acordo
            com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
          </Typography>

          <Section id="dados" title="1. Quais dados coletamos">
            <Typography component="div">
              <ul style={{ margin: 0, paddingLeft: 24 }}>
                <li>
                  <strong>Conta:</strong> e-mail (para o link de acesso) e, se você entrar com o Google, nome e foto do perfil
                  Google.
                </li>
                <li>
                  <strong>Perfil:</strong> nome, apelido, celular (opcional) e posições em campo.
                </li>
                <li>
                  <strong>Uso na patota:</strong> confirmações de presença, presença real, gols, times sorteados, cobranças e
                  pagamentos informados, avisos, comentários e reações.
                </li>
                <li>
                  <strong>Convidados sem conta:</strong> o organizador pode cadastrar só o nome e a posição de quem joga de
                  vez em quando.
                </li>
              </ul>
            </Typography>
            <Typography>
              Não coletamos documentos, dados bancários ou de cartão. Pagamentos acontecem fora do app (por exemplo, PIX);
              o app só registra se a cobrança está pendente ou paga.
            </Typography>
          </Section>

          <Section id="finalidade" title="2. Para que usamos">
            <Typography>
              Usamos os dados apenas para o funcionamento da patota: entrar no app, montar a lista do jogo, sortear times
              equilibrados, controlar o caixa e avisar os integrantes. Não vendemos, não alugamos e não usamos seus dados para
              publicidade. A base legal é a execução do serviço que você solicitou ao criar a conta ou entrar numa patota.
            </Typography>
          </Section>

          <Section id="quem-ve" title="3. Quem vê o quê">
            <Typography component="div">
              <ul style={{ margin: 0, paddingLeft: 24 }}>
                <li>Só integrantes de uma patota veem os dados dela; quem não participa não vê nem que ela existe.</li>
                <li>
                  A <strong>nota de habilidade</strong> usada no sorteio é vista só por organizadores e co-organizadores.
                </li>
                <li>
                  <strong>Cobranças</strong>: cada pessoa vê apenas as próprias; organizadores veem as de todos para
                  controlar o caixa.
                </li>
                <li>Avisos de pagamento na linha do tempo aparecem só para organizadores.</li>
                <li>Seu e-mail aparece para organizadores apenas quando você pede para entrar numa patota.</li>
              </ul>
            </Typography>
          </Section>

          <Section id="cookies" title="4. Cookies">
            <Typography>
              Usamos apenas cookies necessários: um cookie de sessão, que mantém você conectado por até 30 dias, e cookies
              com suas preferências de acessibilidade (tamanho do texto, alto contraste e menos animação). Não usamos cookies
              de propaganda nem de rastreamento.
            </Typography>
          </Section>

          <Section id="guarda" title="5. Por quanto tempo guardamos">
            <Typography>
              Os dados ficam guardados enquanto sua conta existir. Os links de acesso por e-mail valem 24 horas. Quando você
              exclui a conta, apagamos seu perfil, suas presenças, cobranças e sessões. Patotas em que você era o único
              integrante são apagadas junto.
            </Typography>
          </Section>

          <Section id="direitos" title="6. Seus direitos">
            <Typography>
              Você pode ver e corrigir seus dados a qualquer momento em <strong>Meu perfil</strong>, sair de todos os
              aparelhos e <strong>excluir sua conta</strong> (Meu perfil → Excluir conta). Se você é organizador único de uma
              patota com outras pessoas, promova outro organizador antes de excluir, para a patota não ficar sem
              responsável.
            </Typography>
          </Section>

          <Section id="seguranca" title="7. Segurança">
            <Typography>
              O acesso é sem senha, por link enviado ao seu e-mail ou pela conta Google. A comunicação usa HTTPS, e cada ação é
              conferida no servidor: ninguém consegue ver ou alterar dados de uma patota da qual não participa.
            </Typography>
          </Section>

          <Section id="contato" title="8. Contato">
            <Typography>
              Dúvidas ou pedidos sobre seus dados: fale com o organizador da sua patota ou com o responsável pelo projeto
              PatotApp pelo e-mail <strong>[e-mail do responsável pelo projeto]</strong>.
            </Typography>
          </Section>

          <LinkButton href="/" variant="outlined" sx={{ alignSelf: "flex-start" }}>
            Voltar ao PatotApp
          </LinkButton>
        </Stack>
      </Paper>
    </Container>
  );
}
