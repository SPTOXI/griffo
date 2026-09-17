import { permanentRedirect } from 'next/navigation'
import { ATS_CHECK_PATH } from '@/lib/ats-check/copy'

/** Endereço antigo (só em português). O teste agora vive em `/ats-check`. */
export default function LegacyAtsCheckRedirect() {
  permanentRedirect(`${ATS_CHECK_PATH}?lang=pt`)
}
