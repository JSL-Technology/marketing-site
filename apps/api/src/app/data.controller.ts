import { Controller, Get, Param, Query, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataService } from './data.service';

// SEG-16: Only allow safe slug characters (lowercase alphanumeric + hyphens).
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

function validateSlug(slug: string): void {
  if (!SLUG_REGEX.test(slug) || slug.length > 100) {
    throw new BadRequestException(`Invalid slug: ${slug}`);
  }
}

@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Get('solutions')
  getSolutions() {
    return this.dataService.getSolutions();
  }

  @Get('solutions/:slug')
  getSolutionBySlug(@Param('slug') slug: string) {
    validateSlug(slug);
    // BUG-12: Return NotFoundException instead of undefined (HTTP 200) when not found.
    const result = this.dataService.getSolutionBySlug(slug);
    if (!result) throw new NotFoundException(`Solution '${slug}' not found`);
    return result;
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
    validateSlug(slug);
    // BUG-12: Return NotFoundException instead of undefined (HTTP 200) when not found.
    const result = this.dataService.getPostBySlug(slug);
    if (!result) throw new NotFoundException(`Blog post '${slug}' not found`);
    return result;
  }

  @Get('related-posts')
  getRelatedPosts(@Query('slug') slug: string, @Query('tags') tags: string) {
    if (slug) validateSlug(slug);
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
