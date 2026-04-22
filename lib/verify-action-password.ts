import { prisma } from '@/lib/db';
import { compare } from 'bcryptjs';

/**
 * Verifica la contraseña de acción de un usuario
 * @param userEmail - Email del usuario
 * @param password - Contraseña a verificar
 * @returns true si la contraseña es válida, false en caso contrario
 */
export async function verifyActionPassword(
  userEmail: string,
  password: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return { valid: false, error: 'Usuario no encontrado' };
    }

    // Si tiene actionPassword configurada, usarla
    if (user.actionPassword) {
      // Verificar si está hasheada o en texto plano
      if (user.actionPassword.startsWith('$2')) {
        // Está hasheada con bcrypt
        const isValid = await compare(password, user.actionPassword);
        return { 
          valid: isValid, 
          error: isValid ? undefined : 'Contraseña de acción incorrecta' 
        };
      } else {
        // Está en texto plano (comparación directa)
        const isValid = user.actionPassword === password;
        return { 
          valid: isValid, 
          error: isValid ? undefined : 'Contraseña de acción incorrecta' 
        };
      }
    }

    // Si no tiene actionPassword, usar la contraseña de login
    const isValid = await compare(password, user.password);
    return { 
      valid: isValid, 
      error: isValid ? undefined : 'Contraseña incorrecta. Configure su contraseña de acción en su perfil.' 
    };
  } catch (error) {
    console.error('Error verificando contraseña de acción:', error);
    return { valid: false, error: 'Error al verificar contraseña' };
  }
}
