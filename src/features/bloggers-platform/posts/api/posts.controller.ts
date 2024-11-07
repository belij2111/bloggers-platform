import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from '../application/posts.service';
import { PostViewModel } from './models/view/post.view.model';
import { PostsQueryRepository } from '../infrastructure/posts.query-repository';
import {
  GetPostQueryParams,
  PostCreateModel,
} from './models/input/create-post.input.model';
import { BasicAuthGuard } from '../../../../core/guards/basic-auth.guard';
import { ApiBasicAuth, ApiBearerAuth } from '@nestjs/swagger';
import { PaginatedViewModel } from '../../../../core/models/base.paginated.view.model';
import {
  CommentCreateModel,
  GetCommentQueryParams,
} from '../../comments/api/models/input/create-comment.input.model';
import { CommentsService } from '../../comments/application/comments.service';
import { CurrentUserId } from '../../../../core/decorators/identification/current-user-id.param.decorator';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { CommentsQueryRepository } from '../../comments/infrastructure/comments.query-repository';
import { CommentViewModel } from '../../comments/api/models/view/comment.view.model';

@Controller('/posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly commentsService: CommentsService,
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  @Post()
  @UseGuards(BasicAuthGuard)
  @ApiBasicAuth()
  async create(@Body() postCreateModel: PostCreateModel) {
    const createdPostId = await this.postsService.create(postCreateModel);
    return await this.postsQueryRepository.getById(createdPostId.id);
  }

  @Get()
  async getAll(
    @Query() query: GetPostQueryParams,
  ): Promise<PaginatedViewModel<PostViewModel[]>> {
    return await this.postsQueryRepository.getAll(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<PostViewModel> {
    const foundPost = await this.postsQueryRepository.getById(id);
    if (!foundPost) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }
    return foundPost;
  }

  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @ApiBasicAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id') id: string,
    @Body() postCreateModel: PostCreateModel,
  ) {
    await this.postsService.update(id, postCreateModel);
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @ApiBasicAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.postsService.delete(id);
  }

  @Post('/:postId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createCommentByPostId(
    @CurrentUserId() currentUserId: string,
    @Param('postId') postId: string,
    @Body() commentCreateModel: CommentCreateModel,
  ) {
    const createdUserId = await this.commentsService.create(
      currentUserId,
      postId,
      commentCreateModel,
    );
    return await this.commentsQueryRepository.getCommentById(createdUserId.id);
  }

  @Get('/:postId/comments')
  async getCommentsByPostId(
    @Param('postId') postId: string,
    @Query() query: GetCommentQueryParams,
  ): Promise<PaginatedViewModel<CommentViewModel[]>> {
    return await this.commentsQueryRepository.getCommentsByPostId(
      postId,
      query,
    );
  }
}
