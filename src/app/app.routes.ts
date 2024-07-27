import { Routes } from '@angular/router';
import { PlaygroundComponent } from './pages/playground/playground.component';

export const routes: Routes = [
  { path: 'playground', loadComponent: () => PlaygroundComponent },
  { path: '**', redirectTo: 'playground' },
];
