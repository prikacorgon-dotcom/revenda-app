/**
 * Formatação e utilitários para BellaGestão
 */

export function formatCurrency(value: number): string {
  if (isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDateBR(dateString: string): string {
  if (!dateString) return '-';
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function formatPhone(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function cleanPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

/**
 * Calcula lista de parcelas com datas de vencimento automaticamente
 */
export function calculateInstallmentDates(
  firstDueDate: string,
  count: number,
  intervalDays: number,
  totalAmount: number
): Array<{ installmentNumber: number; dueDate: string; amount: number; isPaid: boolean }> {
  if (count <= 0) return [];
  
  const baseDate = new Date(firstDueDate + 'T12:00:00Z');
  if (isNaN(baseDate.getTime())) return [];

  const rawPerInstallment = totalAmount / count;
  const roundedPerInstallment = Math.round(rawPerInstallment * 100) / 100;
  // ajuste de centavos na primeira ou última parcela
  const installments = [];
  let accumulated = 0;

  for (let i = 0; i < count; i++) {
    const installmentDate = new Date(baseDate);
    installmentDate.setDate(baseDate.getDate() + i * intervalDays);

    const year = installmentDate.getFullYear();
    const month = String(installmentDate.getMonth() + 1).padStart(2, '0');
    const day = String(installmentDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    let amount = roundedPerInstallment;
    if (i === count - 1) {
      amount = Math.round((totalAmount - accumulated) * 100) / 100;
    } else {
      accumulated += amount;
    }

    installments.push({
      installmentNumber: i + 1,
      dueDate: dateStr,
      amount,
      isPaid: false,
    });
  }

  return installments;
}

/**
 * Retorna status de prazo em relação a hoje: 'overdue' | 'today' | 'upcoming' | 'ok'
 */
export function getDueStatus(dueDateString: string): {
  status: 'overdue' | 'today' | 'upcoming' | 'future';
  daysDiff: number;
  label: string;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = dueDateString.split('-');
  const due = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'overdue',
      daysDiff: Math.abs(diffDays),
      label: `Venceu há ${Math.abs(diffDays)} dia(s)`,
    };
  } else if (diffDays === 0) {
    return {
      status: 'today',
      daysDiff: 0,
      label: 'Vence HOJE',
    };
  } else if (diffDays <= 3) {
    return {
      status: 'upcoming',
      daysDiff: diffDays,
      label: `Vence em ${diffDays} dia(s)`,
    };
  } else {
    return {
      status: 'future',
      daysDiff: diffDays,
      label: `Vence em ${diffDays} dias`,
    };
  }
}

/**
 * Cria mensagem pronta e educada para WhatsApp do cliente
 */
export function buildClientWhatsAppMessage(params: {
  clientName: string;
  consultantName: string;
  installmentNumber?: number;
  totalInstallments?: number;
  amount: number;
  dueDate: string;
  pixKey?: string;
  pixKeyType?: string;
}): string {
  const {
    clientName,
    consultantName,
    installmentNumber,
    totalInstallments,
    amount,
    dueDate,
    pixKey,
    pixKeyType,
  } = params;

  const dueStatus = getDueStatus(dueDate);
  let statusPhrase = `com vencimento em *${formatDateBR(dueDate)}*`;
  if (dueStatus.status === 'today') {
    statusPhrase = `que *vence hoje (${formatDateBR(dueDate)})*`;
  } else if (dueStatus.status === 'overdue') {
    statusPhrase = `que venceu em *${formatDateBR(dueDate)}* (há ${dueStatus.daysDiff} dias)`;
  }

  const installmentLabel =
    installmentNumber && totalInstallments && totalInstallments > 1
      ? `parcela (${installmentNumber}/${totalInstallments})`
      : 'parcela/compra';

  let pixText = '';
  if (pixKey) {
    pixText = `\n\n🔑 *Chave Pix para pagamento:* ${pixKey} (${pixKeyType || 'Pix'})`;
  }

  return `Olá, ${clientName}! Tudo bem com você? ✨\n\nAqui é a ${consultantName || 'sua consultora de beleza'}. Passando com carinho para lembrar sobre a sua ${installmentLabel} de cosméticos no valor de *${formatCurrency(
    amount
  )}*, ${statusPhrase}.${pixText}\n\nQualquer dúvida estou à disposição! Se já realizou o pagamento, pode desconsiderar. Muito obrigada pela confiança e carinho! 💕`;
}

/**
 * Monta URL direta do WhatsApp (wa.me)
 */
export function generateWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = cleanPhoneForWhatsApp(phone);
  if (!cleanPhone) return '';
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

/**
 * Monta URL de mailto para cliente
 */
export function generateMailtoUrl(params: {
  email: string;
  clientName: string;
  consultantName: string;
  amount: number;
  dueDate: string;
  pixKey?: string;
}): string {
  const subject = encodeURIComponent(
    `Lembrete de Vencimento - Consultoria de Beleza (${formatDateBR(params.dueDate)})`
  );
  const body = encodeURIComponent(
    `Olá ${params.clientName},\n\nTudo bem?\nPassando para enviar o lembrete da sua parcela de cosméticos de ${formatCurrency(
      params.amount
    )} com vencimento em ${formatDateBR(params.dueDate)}.\n\n${
      params.pixKey ? `Chave Pix: ${params.pixKey}\n\n` : ''
    }Atenciosamente,\n${params.consultantName || 'Sua Consultora de Beleza'}`
  );
  return `mailto:${params.email}?subject=${subject}&body=${body}`;
}
