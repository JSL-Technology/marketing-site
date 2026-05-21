import { Injectable } from '@nestjs/common';
// For a real app, we would use a database.
// For this task, we will use the shared mock-data logic.
import {
  SOLUTIONS,
  PRODUCTS,
  PROJECTS,
  BLOG_POSTS,
  TEAM_MEMBERS,
  TESTIMONIALS,
  TECH_STACK,
  VENTURES
} from '../../../app/src/app/core/data/mock-data';

@Injectable()
export class DataService {
  getSolutions() {
    return SOLUTIONS;
  }

  getSolutionBySlug(slug: string) {
    return SOLUTIONS.find(s => s.slug === slug);
  }

  getProducts() {
    return PRODUCTS;
  }

  getProjects() {
    return PROJECTS;
  }

  getBlogPosts() {
    return BLOG_POSTS;
  }

  getPostBySlug(slug: string) {
    return BLOG_POSTS.find(p => p.slug === slug);
  }

  getRelatedPosts(currentSlug: string, tags: string[]) {
    return BLOG_POSTS.filter(
      post => post.slug !== currentSlug && post.tags.some(tag => tags.includes(tag))
    ).slice(0, 3);
  }

  getTeamMembers() {
    return TEAM_MEMBERS;
  }

  getTestimonials() {
    return TESTIMONIALS;
  }

  getTechStack() {
    return TECH_STACK;
  }

  getVentures() {
    return VENTURES;
  }
}
