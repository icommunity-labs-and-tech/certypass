"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserWithDetails } from "@/lib/auth/shared/session";
import { icommunityService } from "@/infrastructure/icommunity/ICommunityServiceImpl";

export interface RetryOrganizationKycResult {
  success: boolean;
  kycURL?: string | null;
  error?: string;
}

/**
 * Reintenta el proceso de KYC de la organización obteniendo una nueva URL
 */
export async function retryOrganizationKyc(): Promise<RetryOrganizationKycResult> {
  try {
    const user = await getCurrentUserWithDetails();
    
    if (!user?.id) {
      return {
        success: false,
        error: "Usuario no autenticado",
      };
    }

    // Obtener usuario con su organización
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        organizationId: true,
        Organization: {
          select: {
            id: true,
            nombre: true,
            signatureID: true,
            verificationStatus: true,
          },
        },
      },
    });

    if (!userWithOrg || !userWithOrg.Organization) {
      return {
        success: false,
        error: "Usuario sin organización asociada",
      };
    }

    const organization = userWithOrg.Organization;

    // Obtener la URL base de la aplicación para los webhooks
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.APP_URL || 'http://localhost:3000';
    
    const okUrl = `${baseUrl}/api/hooks/signature/ok`;
    const koUrl = `${baseUrl}/api/hooks/signature/ko`;

    // Si el estado es REJECTED o no tiene signatureID, crear una nueva firma
    // Esto sustituye la firma anterior con una nueva
    if (organization.verificationStatus === 'REJECTED' || !organization.signatureID) {
      const signatureResult = await icommunityService.createSignature(
        organization.nombre,
        okUrl,
        koUrl
      );

      // Actualizar organización con el nuevo signatureID y kycURL (sustituyendo el anterior)
      await prisma.organization.update({
        where: { id: organization.id },
        data: {
          signatureID: signatureResult.signature_id,
          kycURL: signatureResult.url || null,
          verificationStatus: signatureResult.signature_id ? 'WAITING' : 'NOT_VERIFIED',
        },
      });

      return {
        success: true,
        kycURL: signatureResult.url || null,
      };
    }

    // Si el estado es WAITING o NOT_VERIFIED y ya tiene signatureID, usar retrySignature
    try {
      const retryResult = await icommunityService.retrySignature(organization.signatureID);
      
      // Actualizar kycURL si se obtuvo una nueva
      if (retryResult.url) {
        await prisma.organization.update({
          where: { id: organization.id },
          data: {
            kycURL: retryResult.url,
            verificationStatus: 'WAITING',
          },
        });
      }

      return {
        success: true,
        kycURL: retryResult.url || null,
      };
    } catch (retryError) {
      console.error("Error retrying signature:", retryError);
      // Si retry falla, devolver la URL existente si hay una
      const org = await prisma.organization.findUnique({
        where: { id: organization.id },
        select: { kycURL: true },
      });

      return {
        success: true,
        kycURL: org?.kycURL || null,
      };
    }
  } catch (error) {
    console.error("Error retrying organization KYC:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al reintentar el proceso de KYC",
    };
  }
}
