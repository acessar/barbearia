// ===== VARIÁVEIS GLOBAIS =====
let usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado')) || null;
let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
let agendamentos = JSON.parse(localStorage.getItem('agendamentos')) || [];

// ===== FUNÇÕES MODAIS =====
function abrirModalLogin() {
    document.getElementById('modalLogin').style.display = 'block';
}

function fecharModalLogin() {
    document.getElementById('modalLogin').style.display = 'none';
}

function scrollToServicos() {
    document.getElementById('servicos').scrollIntoView({ behavior: 'smooth' });
}

// ===== ABAS LOGIN/CADASTRO =====
function mudarTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    document.getElementById(tab).classList.add('active');
    event.target.classList.add('active');
}

// ===== AUTENTICAÇÃO =====
function fazerCadastro(e) {
    e.preventDefault();

    const nome = document.getElementById('nomeCadastro').value.trim();
    const email = document.getElementById('emailCadastro').value.trim().toLowerCase();
    const whatsapp = document.getElementById('whatsappCadastro').value.trim();
    const senha = document.getElementById('senhaCadastro').value;
    const senhaConfirm = document.getElementById('senhaConfirm').value;

    if (!nome || !email || !whatsapp || !senha) {
        alert('Preencha todos os campos!');
        return;
    }

    if (senha !== senhaConfirm) {
        alert('As senhas não coincidem!');
        return;
    }

    if (senha.length < 4) {
        alert('A senha deve ter pelo menos 4 caracteres!');
        return;
    }

    if (usuarios.find(u => u.email === email)) {
        alert('Este e-mail já está cadastrado!');
        return;
    }

    const novoUsuario = { nome, email, whatsapp, senha };
    usuarios.push(novoUsuario);
    localStorage.setItem('usuarios', JSON.stringify(usuarios));

    alert('Cadastro realizado com sucesso! Faça login para continuar.');

    document.getElementById('cadastro').querySelector('form').reset();
    mudarTab('login');
}

function fazerLogin(e) {
    e.preventDefault();

    const email = document.getElementById('emailLogin').value.trim().toLowerCase();
    const senha = document.getElementById('senhaLogin').value;

    if (!email || !senha) {
        alert('Preencha e-mail e senha!');
        return;
    }

    const usuario = usuarios.find(u => u.email === email && u.senha === senha);

    if (usuario) {
        usuarioLogado = usuario;
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
        fecharModalLogin();
        document.getElementById('login').querySelector('form').reset();
        atualizarPainel();
        alert('Login realizado com sucesso!');
    } else {
        alert('E-mail ou senha incorretos!');
    }
}

function logout() {
    usuarioLogado = null;
    localStorage.removeItem('usuarioLogado');
    document.getElementById('painelCliente').style.display = 'none';
    alert('Desconectado com sucesso!');
}

// ===== VARIÁVEIS AGENDAMENTO PROGRESSIVO =====
let agendamentoAtual = {
    servico: null,
    subcategoria: null,
    data: null,
    horario: null,
    observacoes: null
};
let passoAtual = 1;
let mesCalendario = new Date();
let dataMinima = new Date();

// ===== GERENCIAR STEPS DO AGENDAMENTO =====
function abrirModalAgendamento() {
    if (!usuarioLogado) {
        alert('Faça login para agendar um corte!');
        abrirModalLogin();
        return;
    }
    agendamentoAtual = { servico: null, subcategoria: null, data: null, horario: null };
    passoAtual = 1;
    mostrarStep(1);
    document.getElementById('modalAgendamento').style.display = 'block';
}

function fecharModalAgendamento() {
    document.getElementById('modalAgendamento').style.display = 'none';
}

function mostrarStep(n) {
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById('step' + i);
        if (step) {
            step.style.display = i === n ? 'block' : 'none';
        }
    }
    passoAtual = n;
}

function avancarPasso() {
    if (passoAtual === 1) {
        mostrarStep(2);
    } else if (passoAtual === 2) {
        if (!agendamentoAtual.subcategoria) {
            alert('Selecione uma opção!');
            return;
        }
        mostrarStep(3);
        inicializarSeletorData();
    } else if (passoAtual === 3) {
        if (!agendamentoAtual.data || !agendamentoAtual.horario) {
            alert('Selecione data e horário!');
            return;
        }
        mostrarStep(4);
        mostrarResumo();
    }
}

function voltarPasso() {
    if (passoAtual > 1) {
        mostrarStep(passoAtual - 1);
    }
}

function selecionarServico(servico, nomServico) {
    agendamentoAtual.servico = servico;
    agendamentoAtual.subcategoria = null;

    const subcategorias = {
        corte: [
            { id: 'corte-social', nome: 'Corte Social', valor: 60 },
            { id: 'corte-degrad', nome: 'Corte Degradê', valor: 60 },
            { id: 'corte-taper', nome: 'Corte Taper', valor: 60 },
            { id: 'corte-skin', nome: 'Corte Skin', valor: 70 }
        ],
        barba: [
            { id: 'barba-completa', nome: 'Barba Completa', valor: 45 },
            { id: 'barba-manutenção', nome: 'Manutenção', valor: 30 },
            { id: 'barba-design', nome: 'Design de Barba', valor: 50 }
        ],
        luzes: [
            { id: 'luzes-meches', nome: 'Mechas', valor: 120 },
            { id: 'luzes-tinta', nome: 'Tinta', valor: 100 },
            { id: 'luzes-ombre', nome: 'Ombre Hair', valor: 150 }
        ]
    };

    const pergunta = document.getElementById('pergunta-subcategoria');
    pergunta.textContent = `Qual tipo de ${nomServico.toLowerCase()} você quer?`;

    const opcoes = document.getElementById('opcoes-subcategoria');
    opcoes.innerHTML = '';

    subcategorias[servico].forEach(sub => {
        const div = document.createElement('div');
        div.className = 'opcao-item';
        div.innerHTML = `
                    <h4>${sub.nome}</h4>
                    <p style="font-size: 0.9rem; color: #999;">R$ ${sub.valor.toFixed(2)}</p>
                `;
        div.onclick = () => selecionarSubcategoria(sub.id, sub.nome, sub.valor);
        opcoes.appendChild(div);
    });

    // Adicionar opção "Outro"
    const divOutro = document.createElement('div');
    divOutro.className = 'opcao-item';
    divOutro.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--dourado)" stroke-width="2" style="width: 30px; height: 30px; margin: 0 auto 0.5rem;">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <h4>Outro</h4>
                <p style="font-size: 0.9rem; color: #999;">Especifique o serviço</p>
            `;
    divOutro.onclick = () => abrirOutroServico();
    opcoes.appendChild(divOutro);

    mostrarStep(2);
}

function abrirOutroServico() {
    document.getElementById('outro-servico-form').style.display = 'block';
    document.getElementById('opcoes-subcategoria').style.display = 'none';
    document.getElementById('btn-avancar-2').disabled = true;
}

function confirmarOutroServico() {
    const nome = document.getElementById('outro-servico-nome').value.trim();
    const valor = document.getElementById('outro-servico-valor').value;

    if (!nome || !valor) {
        alert('Preencha o nome e valor do serviço!');
        return;
    }

    agendamentoAtual.subcategoria = {
        id: 'outro-' + Date.now(),
        nome: nome,
        valor: parseFloat(valor)
    };

    document.getElementById('outro-servico-form').style.display = 'none';
    document.getElementById('outro-servico-nome').value = '';
    document.getElementById('outro-servico-valor').value = '';
    document.getElementById('opcoes-subcategoria').style.display = 'grid';
    document.getElementById('btn-avancar-2').disabled = false;
}

function selecionarSubcategoria(id, nome, valor) {
    agendamentoAtual.subcategoria = { id, nome, valor };

    document.querySelectorAll('#opcoes-subcategoria .opcao-item').forEach(item => {
        item.classList.remove('selecionada');
    });
    event.target.closest('.opcao-item').classList.add('selecionada');

    document.getElementById('btn-avancar-2').disabled = false;
}

// ===== STEP 3: SELEÇÃO DE DATA E HORÁRIO =====
function inicializarSeletorData() {
    const hoje = new Date();
    // Defini data mínima como hoje (00:00:00)
    dataMinima = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    mesCalendario = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    gerarCalendario();
}

function gerarCalendario() {
    const ano = mesCalendario.getFullYear();
    const mes = mesCalendario.getMonth();

    document.getElementById('mes-ano').textContent =
        mesCalendario.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaSemanaPrimeiro = primeiroDia.getDay();

    let html = '';
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

    diasSemana.forEach(dia => {
        html += `<div class="dia-semana">${dia}</div>`;
    });

    for (let i = 0; i < diaSemanaPrimeiro; i++) {
        html += '<div class="dia-calendario dia-outro-mes"></div>';
    }

    for (let dia = 1; dia <= diasNoMes; dia++) {
        const dataAtual = new Date(ano, mes, dia);
        const dataString = dataAtual.toISOString().split('T')[0];

        let classe = 'dia-calendario';
        let onclick = `selecionarData('${dataString}')`;

        // Comparação corrigida: apenas compara datas, sem considerar hora
        if (dataAtual < dataMinima) {
            classe += ' dia-desabilitado';
            onclick = '';
        } else if (dataString === agendamentoAtual.data) {
            classe += ' dia-selecionado';
        }

        html += `<div class="${classe}" onclick="${onclick}">${dia}</div>`;
    }

    const diasRestantes = 42 - (diaSemanaPrimeiro + diasNoMes);
    for (let i = 0; i < diasRestantes; i++) {
        html += '<div class="dia-calendario dia-outro-mes"></div>';
    }

    document.getElementById('dias-calendario').innerHTML = html;
}

function mesAnterior() {
    const hoje = new Date();
    const mesAtualComparacao = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const mesCalendarioComparacao = new Date(mesCalendario.getFullYear(), mesCalendario.getMonth(), 1);

    if (mesCalendarioComparacao > mesAtualComparacao) {
        mesCalendario.setMonth(mesCalendario.getMonth() - 1);
        gerarCalendario();
    }
}

function proximoMes() {
    mesCalendario.setMonth(mesCalendario.getMonth() + 1);
    gerarCalendario();
}

function selecionarData(dataString) {
    agendamentoAtual.data = dataString;
    agendamentoAtual.horario = null;
    document.getElementById('btn-avancar-3').disabled = true;
    gerarCalendario();
    gerarHorarios();
    document.getElementById('horarios-container').style.display = 'block';
}

function gerarHorarios() {
    const horarios = [];
    const inicio = 9;
    const fim = 18;
    const pausa_inicio = 13;
    const pausa_fim = 14;

    for (let hora = inicio; hora < fim; hora++) {
        for (let minuto = 0; minuto < 60; minuto += 30) {
            if (!(hora >= pausa_inicio && hora < pausa_fim)) {
                const horaStr = String(hora).padStart(2, '0');
                const minutoStr = String(minuto).padStart(2, '0');
                horarios.push(`${horaStr}:${minutoStr}`);
            }
        }
    }

    const container = document.getElementById('opcoes-horarios');
    container.innerHTML = '';

    horarios.forEach(horario => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'horario-item';
        btn.textContent = horario;
        btn.onclick = (e) => {
            e.preventDefault();
            selecionarHorario(horario);
        };
        container.appendChild(btn);
    });
}

function selecionarHorario(horario) {
    agendamentoAtual.horario = horario;

    document.querySelectorAll('.horario-item').forEach(item => {
        item.classList.remove('selecionado');
    });
    event.target.classList.add('selecionado');

    document.getElementById('btn-avancar-3').disabled = false;
}

// ===== STEP 4: RESUMO E CONFIRMAÇÃO =====
function mostrarResumo() {
    const nomeServicos = {
        'corte-social': 'Corte Social',
        'corte-degrad': 'Corte Degradê',
        'corte-taper': 'Corte Taper',
        'corte-skin': 'Corte Skin',
        'barba-completa': 'Barba Completa',
        'barba-manutenção': 'Manutenção de Barba',
        'barba-design': 'Design de Barba',
        'luzes-meches': 'Mechas',
        'luzes-tinta': 'Tinta',
        'luzes-ombre': 'Ombre Hair'
    };

    agendamentoAtual.observacoes = document.getElementById('observacoes').value.trim();

    const data = new Date(agendamentoAtual.data + 'T00:00:00');
    const dataFormatada = data.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    let nomeServico = nomeServicos[agendamentoAtual.subcategoria.id] || agendamentoAtual.subcategoria.nome;

    let html = `
                <p><strong>Serviço:</strong> ${nomeServico}</p>
                <p><strong>Data:</strong> ${dataFormatada}</p>
                <p><strong>Horário:</strong> ${agendamentoAtual.horario}</p>
                <p><strong>Cliente:</strong> ${usuarioLogado.nome}</p>
                <p><strong>E-mail:</strong> ${usuarioLogado.email}</p>
                <p><strong>WhatsApp:</strong> ${usuarioLogado.whatsapp}</p>
            `;

    if (agendamentoAtual.observacoes) {
        html += `<p><strong>Observações:</strong> ${agendamentoAtual.observacoes}</p>`;
    }

    document.getElementById('resumo-agendamento').innerHTML = html;
}

function confirmarAgendamento() {
    const novoAgendamento = {
        id: Date.now(),
        usuario: usuarioLogado.email,
        subcategoria: agendamentoAtual.subcategoria.id,
        servico: agendamentoAtual.servico,
        data: agendamentoAtual.data,
        horario: agendamentoAtual.horario,
        whatsapp: usuarioLogado.whatsapp,
        status: 'confirmado',
        observacoes: agendamentoAtual.observacoes,
        dataCriacao: new Date().toLocaleDateString('pt-BR')
    };

    agendamentos.push(novoAgendamento);
    localStorage.setItem('agendamentos', JSON.stringify(agendamentos));

    // Enviar por Email e WhatsApp
    enviarConfirmacao(novoAgendamento);

    alert('Agendamento realizado com sucesso! Confirmação enviada por email e WhatsApp.');
    fecharModalAgendamento();
    atualizarPainel();
}

function enviarConfirmacao(agendamento) {
    const data = new Date(agendamento.data + 'T00:00:00');
    const dataFormatada = data.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const nomeServicos = {
        'corte-social': 'Corte Social',
        'corte-degrad': 'Corte Degradê',
        'corte-taper': 'Corte Taper',
        'corte-skin': 'Corte Skin',
        'barba-completa': 'Barba Completa',
        'barba-manutenção': 'Manutenção de Barba',
        'barba-design': 'Design de Barba',
        'luzes-meches': 'Mechas',
        'luzes-tinta': 'Tinta',
        'luzes-ombre': 'Ombre Hair'
    };

    let nomeServico = nomeServicos[agendamento.subcategoria] || agendamento.servico;

    const mensagem = `Olá ${usuarioLogado.nome}!

    Seu agendamento foi confirmado:

    Serviço: ${nomeServico}
    Data: ${dataFormatada}
    Horário: ${agendamento.horario}
    Cliente: ${usuarioLogado.nome}
    E-mail: ${usuarioLogado.email}
    WhatsApp: ${usuarioLogado.whatsapp}
    ${agendamento.observacoes ? `Observações: ${agendamento.observacoes}` : ''}

    Obrigado por escolher nossos serviços!

    Elite Barber`;

    // Enviar por Email
    const emailLink = `mailto:${usuarioLogado.email}?subject=Confirmação de Agendamento - Elite Barber&body=${encodeURIComponent(mensagem)}`;
    window.open(emailLink);

    // Enviar por WhatsApp
    const telefone = '5583991816152';
    const mensagemWhatsApp = `Olá, tenho um novo agendamento:\n\n${mensagem}`;
    const whatsappLink = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagemWhatsApp)}`;
    window.open(whatsappLink);
}

function atualizarPainel() {
    if (!usuarioLogado) {
        document.getElementById('painelCliente').style.display = 'none';
        return;
    }

    document.getElementById('painelCliente').style.display = 'block';

    const meusAgendamentos = agendamentos.filter(a => a.usuario === usuarioLogado.email);

    let htmlAgendamentos = '';
    if (meusAgendamentos.length === 0) {
        htmlAgendamentos = '<p style="color: var(--branco);">Nenhum agendamento realizado.</p>';
    } else {
        meusAgendamentos.forEach(agendamento => {
            const nomeServicos = {
                'corte-social': 'Corte Social',
                'corte-degrad': 'Corte Degradê',
                'corte-taper': 'Corte Taper',
                'corte-skin': 'Corte Skin',
                'barba-completa': 'Barba Completa',
                'barba-manutenção': 'Manutenção de Barba',
                'barba-design': 'Design de Barba',
                'luzes-meches': 'Mechas',
                'luzes-tinta': 'Tinta',
                'luzes-ombre': 'Ombre Hair'
            };

            const nomeServico = nomeServicos[agendamento.subcategoria] || agendamento.servico;

            htmlAgendamentos += `
                        <div class="agendamento-item">
                            <strong>${nomeServico}</strong>
                            <p>
                                <svg viewBox="0 0 24 24" fill="none" stroke="var(--dourado)" stroke-width="2" style="width: 16px; height: 16px; display: inline; margin-right: 0.5rem;">
                                    <rect x="3" y="4" width="18" height="16" rx="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                                ${new Date(agendamento.data + 'T00:00:00').toLocaleDateString('pt-BR')} às ${agendamento.horario}
                            </p>
                            <p>Status: <span style="color: #4caf50;">${agendamento.status}</span></p>
                            <button class="btn-acao" onclick="adiarAgendamento(${agendamento.id})">Adiar</button>
                            <button class="btn-acao btn-cancelar" onclick="cancelarAgendamento(${agendamento.id})">Cancelar</button>
                        </div>
                    `;
        });
    }

    document.getElementById('listaAgendamentos').innerHTML = htmlAgendamentos;

    const htmlInfo = `
                <p><strong>Nome:</strong> ${usuarioLogado.nome}</p>
                <p><strong>E-mail:</strong> ${usuarioLogado.email}</p>
                <p><strong>WhatsApp:</strong> ${usuarioLogado.whatsapp}</p>
            `;

    document.getElementById('minhasInfo').innerHTML = htmlInfo;
}

function cancelarAgendamento(id) {
    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
        agendamentos = agendamentos.filter(a => a.id !== id);
        localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
        atualizarPainel();
        alert('Agendamento cancelado!');
    }
}

function adiarAgendamento(id) {
    const agendamento = agendamentos.find(a => a.id === id);
    if (agendamento) {
        const novaData = prompt('Digite a nova data (YYYY-MM-DD):');
        const novoHorario = prompt('Digite o novo horário (HH:MM):');

        if (novaData && novoHorario) {
            agendamento.data = novaData;
            agendamento.horario = novoHorario;
            localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
            atualizarPainel();
            alert('Agendamento adiado com sucesso!');
        }
    }
}

// ===== INICIALIZAÇÃO =====
window.addEventListener('load', () => {
    atualizarPainel();

    // Fecha modal ao clicar fora
    window.onclick = function (event) {
        const modal = document.getElementById('modalAgendamento');
        const modalLogin = document.getElementById('modalLogin');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
        if (event.target === modalLogin) {
            modalLogin.style.display = 'none';
        }
    }
});