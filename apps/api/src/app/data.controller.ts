import { Controller, Get, Param, Query } from '@nestjs/common';
import { DataService } from './data.service';

@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Get('solutions')
  getSolutions() {
    return this.dataService.getSolutions();
  }

  @Get('solutions/:slug')
  getSolutionBySlug(@Param('slug') slug: string) {
    return this.dataService.getSolutionBySlug(slug);
  }

  @Get('products')
  getProducts() {
    return this.dataService.getProducts();
  }

  @Get('projects')
  getProjects() {
    return this.dataService.getProjects();
  }

  @Get('blog')
  getBlogPosts() {
    return this.dataService.getBlogPosts();
  }

  @Get('blog/:slug')
  getPostBySlug(@Param('slug') slug: string) {
    return this.dataService.getPostBySlug(slug);
  }

  @Get('related-posts')
  getRelatedPosts(@Query('slug') slug: string, @Query('tags') tags: string) {
    const tagsArray = tags ? tags.split(',') : [];
    return this.dataService.getRelatedPosts(slug, tagsArray);
  }

  @Get('team')
  getTeam() {
    return this.dataService.getTeamMembers();
  }

  @Get('testimonials')
  getTestimonials() {
    return this.dataService.getTestimonials();
  }

  @Get('tech-stack')
  getTechStack() {
    return this.dataService.getTechStack();
  }
}
