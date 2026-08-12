"""Mock data layer for the customer-side API contract.

This is intentionally separated from the API route layer so the backend can be
translated to real database-backed services later without changing the contract.
"""

from __future__ import annotations

from typing import Any


def demo_user() -> dict[str, Any]:
    return {
        'id': 'usr_001',
        'phoneNumber': '+94771234567',
        'surname': 'Perera',
        'email': 'perera@gmail.com',
        'isVerified': True,
        'strikes': 0,
    }


def demo_auth_tokens() -> dict[str, str]:
    return {
        'accessToken': 'demo-access-token',
        'refreshToken': 'demo-refresh-token',
    }


def demo_order(order_type: str = 'OTC', pharmacy_id: str = 'phm_101', payment_method: str = 'PAY_AT_COUNTER') -> dict[str, Any]:
    return {
        'id': 'ord_xyz',
        'orderNumber': '#MP827341',
        'orderType': order_type,
        'state': 'WAITING_PHARMACY_CONFIRMATION',
        'totalAmount': 750.0,
        'totalMrp': 870.0,
        'isPaid': False,
        'paymentMethod': payment_method,
        'createdAt': '2026-08-12T01:00:00Z',
        'pharmacyId': pharmacy_id,
    }


def demo_order_list() -> list[dict[str, Any]]:
    return [
        {
            'id': 'ord_xyz',
            'orderNumber': '#MP827341',
            'orderType': 'OTC',
            'state': 'WAITING_CUSTOMER_CONFIRMATION',
            'totalAmount': 750.0,
            'totalMrp': 870.0,
            'isPaid': False,
            'paymentMethod': 'PAY_AT_COUNTER',
            'createdAt': '2026-08-12T01:00:00Z',
        }
    ]


def demo_order_detail(order_id: str) -> dict[str, Any]:
    return {
        'id': order_id,
        'orderNumber': '#MP827341',
        'orderType': 'OTC',
        'state': 'WAITING_CUSTOMER_CONFIRMATION',
        'totalAmount': 750.0,
        'totalMrp': 870.0,
        'isPaid': False,
        'paymentMethod': 'PAY_AT_COUNTER',
        'createdAt': '2026-08-12T01:00:00Z',
        'pharmacyId': 'phm_101',
        'customerNote': 'Please call before pickup',
    }


def demo_cancelled_order(order_id: str) -> dict[str, Any]:
    return {
        'id': order_id,
        'state': 'CANCELLED',
        'strikeAdded': True,
        'customerStrikes': 2,
    }


def demo_pharmacies() -> list[dict[str, Any]]:
    return [
        {
            'id': 'ph_1',
            'name': 'MediCare Central Pharmacy',
            'address': '124 Galle Road, Colombo 03',
            'distance': '0.8 km',
            'rating': 4.9,
            'isOpen': True,
            'isFavorite': True,
        }
    ]


def demo_pharmacy(pharmacy_id: str) -> dict[str, Any]:
    return {
        'id': pharmacy_id,
        'name': 'MediCare Central Pharmacy',
        'address': '124 Galle Road, Colombo 03',
        'distance': '0.8 km',
        'rating': 4.9,
        'isOpen': True,
        'isFavorite': True,
    }


def demo_products() -> list[dict[str, Any]]:
    return [
        {
            'id': 'med_1',
            'name': 'Paracetamol 500mg',
            'category': 'Cold & Flu',
            'isRxRequired': False,
            'inStock': True,
            'mrpPrice': 120.0,
            'pharmacyPrice': 100.0,
        }
    ]


def demo_product(product_id: str) -> dict[str, Any]:
    return {
        'id': product_id,
        'name': 'Paracetamol 500mg',
        'category': 'Cold & Flu',
        'isRxRequired': False,
        'inStock': True,
        'mrpPrice': 120.0,
        'pharmacyPrice': 100.0,
    }


def demo_user_profile() -> dict[str, Any]:
    return {
        'id': 'usr_001',
        'phoneNumber': '+94771234567',
        'surname': 'Perera',
        'email': 'perera@gmail.com',
        'isVerified': True,
        'strikes': 1,
        'pushNotificationsEnabled': True,
        'emailReceiptsEnabled': True,
        'createdAt': '2026-01-01T00:00:00Z',
    }


def demo_quote(order_id: str) -> dict[str, Any]:
    return {
        'orderId': order_id,
        'pharmacyId': 'ph_1',
        'pharmacyName': 'MediCare Central Pharmacy',
        'items': [
            {
                'medicineName': 'Amoxicillin 500mg',
                'mrp': 450.0,
                'quotedPrice': 400.0,
                'quantity': 10,
                'isAlternative': False,
            }
        ],
        'totalAmount': 500.0,
        'totalMrp': 570.0,
        'validUntil': '2026-08-13T01:00:00Z',
    }


def demo_pickup(order_id: str) -> dict[str, Any]:
    return {
        'orderId': order_id,
        'state': 'READY_FOR_PICKUP',
        'pickupOtp': '849201',
        'pickupDeadline': '2026-08-13T18:00:00Z',
        'pharmacy': {
            'id': 'ph_1',
            'name': 'MediCare Central Pharmacy',
            'address': '124 Galle Road, Colombo 03',
        },
    }


def demo_messages(order_id: str) -> list[dict[str, Any]]:
    return [
        {
            'id': 'msg_001',
            'orderId': order_id,
            'senderRole': 'PHARMACIST',
            'senderName': 'Pharmacist',
            'text': 'Your order is ready at counter 2.',
            'timestamp': '2026-08-12T14:10:00Z',
        }
    ]


def demo_notification_list() -> list[dict[str, Any]]:
    return [
        {
            'id': 'notif_001',
            'title': 'Quote Ready',
            'body': 'MediCare Central has sent you a quote. Tap to review.',
            'type': 'QUOTATION_READY',
            'orderId': 'ord_xyz',
            'isRead': False,
            'createdAt': '2026-08-12T14:00:00Z',
        }
    ]


def demo_notification(notification_id: str) -> dict[str, Any]:
    return {
        'id': notification_id,
        'isRead': True,
    }


def demo_issue(order_id: str) -> dict[str, Any]:
    return {
        'id': 'issue_001',
        'orderId': order_id,
        'status': 'ISSUE_REPORTED',
    }


def demo_payment_intent() -> dict[str, str]:
    return {
        'clientSecret': 'pi_..._secret_...',
    }


def demo_prescription() -> dict[str, Any]:
    return {
        'prescriptionId': 'presc_abc123',
        'clarityScore': 88,
        'status': 'PENDING_REVIEW',
        'checks': {
            'clarity': {
                'score': 88,
                'max': 100,
                'passed': True,
            }
        },
    }


def demo_prescription_detail(prescription_id: str) -> dict[str, Any]:
    return {
        'id': prescription_id,
        'status': 'APPROVED',
        'clarityScore': 88,
        'targetPharmacyId': 'ph_1',
    }


def demo_prescription_status(prescription_id: str) -> dict[str, Any]:
    return {
        'prescriptionId': prescription_id,
        'status': 'APPROVED',
        'clarityScore': 88,
    }
