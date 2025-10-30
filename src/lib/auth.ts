import { useState, useEffect, createContext, useContext } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'manager' | 'cashier' | 'waiter' | 'employee';
  restaurantId: string;
  branchId?: string;
  permissions: string[];
  nit?: string;
  restaurantName?: string;
  companyName?: string;
  branchName?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  nit: string;
  ownerId: string;
  branches: Branch[];
  createdAt: Date;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  restaurantId: string;
  managerId?: string;
  isActive: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

class AuthService {
  private currentUser: User | null = null;
  private currentRestaurant: Restaurant | null = null;
  
  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    const userData = localStorage.getItem('conektao_user');
    const restaurantData = localStorage.getItem('conektao_restaurant');
    
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }
    if (restaurantData) {
      this.currentRestaurant = JSON.parse(restaurantData);
    }
  }

  private saveUserToStorage(user: User, restaurant: Restaurant) {
    localStorage.setItem('conektao_user', JSON.stringify(user));
    localStorage.setItem('conektao_restaurant', JSON.stringify(restaurant));
  }

  async login(email: string, password: string): Promise<{ user: User; restaurant: Restaurant }> {
    // Simulated login logic - in real app this would call your backend
    const mockUsers = [
      {
        id: '1',
        email: 'owner@labarra.com',
        name: 'Carlos Rodríguez',
        role: 'owner' as const,
        restaurantId: 'rest-1',
        permissions: ['all'],
        nit: '900123456-7',
        restaurantName: 'La Barra',
        companyName: 'La Barra',
        branchName: 'Sucursal Principal'
      },
      {
        id: '2',
        email: 'manager@labarra.com',
        name: 'Ana Martínez',
        role: 'manager' as const,
        restaurantId: 'rest-1',
        branchId: 'branch-1',
        permissions: ['sales', 'inventory', 'reports', 'team_view']
      },
      {
        id: '3',
        email: 'cajero@labarra.com',
        name: 'Luis García',
        role: 'cashier' as const,
        restaurantId: 'rest-1',
        branchId: 'branch-1',
        permissions: ['sales', 'invoice']
      }
    ];

    const user = mockUsers.find(u => u.email === email);
    if (!user) throw new Error('Usuario no encontrado');

    const restaurant: Restaurant = {
      id: 'rest-1',
      name: 'La Barra',
      nit: '900123456-7',
      ownerId: '1',
      branches: [
        {
          id: 'branch-1',
          name: 'Sucursal Principal',
          address: 'Calle 123 #45-67, Bogotá',
          restaurantId: 'rest-1',
          managerId: '2',
          isActive: true,
          coordinates: { lat: 4.6097, lng: -74.0817 }
        }
      ],
      createdAt: new Date()
    };

    this.currentUser = user;
    this.currentRestaurant = restaurant;
    this.saveUserToStorage(user, restaurant);

    return { user, restaurant };
  }

  async createRestaurant(data: {
    nit: string;
    restaurantName: string;
    ownerName: string;
    email: string;
    password: string;
    branchName: string;
    branchAddress: string;
  }): Promise<{ user: User; restaurant: Restaurant }> {
    const restaurantId = `rest-${Date.now()}`;
    const branchId = `branch-${Date.now()}`;
    const userId = `user-${Date.now()}`;

    const restaurant: Restaurant = {
      id: restaurantId,
      name: data.restaurantName,
      nit: data.nit,
      ownerId: userId,
      branches: [
        {
          id: branchId,
          name: data.branchName,
          address: data.branchAddress,
          restaurantId,
          isActive: true
        }
      ],
      createdAt: new Date()
    };

    const user: User = {
      id: userId,
      email: data.email,
      name: data.ownerName,
      role: 'owner',
      restaurantId,
      permissions: ['all'],
      nit: data.nit,
      restaurantName: data.restaurantName,
      companyName: data.restaurantName,
      branchName: data.branchName
    };

    this.currentUser = user;
    this.currentRestaurant = restaurant;
    this.saveUserToStorage(user, restaurant);

    return { user, restaurant };
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getCurrentRestaurant(): Restaurant | null {
    return this.currentRestaurant;
  }

  hasPermission(permission: string): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.permissions.includes('all') || 
           this.currentUser.permissions.includes(permission);
  }

  logout() {
    this.currentUser = null;
    this.currentRestaurant = null;
    localStorage.removeItem('conektao_user');
    localStorage.removeItem('conektao_restaurant');
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }
}

export const authService = new AuthService();