import { QueueService } from '../../src/application/services/queue.service';
import { NotFoundError, AuthorizationError } from '../../src/shared/errors';

describe('QueueService Unit Tests', () => {
  let queueService: QueueService;
  let mockQueueRepo: any;
  let mockProjectRepo: any;
  let mockOrgRepo: any;

  beforeEach(() => {
    mockQueueRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByProjectId: jest.fn(),
      findByProjectAndName: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getStats: jest.fn(),
    };

    mockProjectRepo = {
      findById: jest.fn(),
    };

    mockOrgRepo = {
      findMembership: jest.fn(),
    };

    queueService = new QueueService(mockQueueRepo, mockProjectRepo, mockOrgRepo);
  });

  describe('createQueue', () => {
    it('should throw NotFoundError if project does not exist', async () => {
      mockProjectRepo.findById.mockResolvedValue(null);

      await expect(
        queueService.createQueue({ projectId: 'non-existent-proj', name: 'test-q' }, 'user-123')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError if user does not belong to the organization', async () => {
      mockProjectRepo.findById.mockResolvedValue({ id: 'proj-1', organizationId: 'org-1' });
      mockOrgRepo.findMembership.mockResolvedValue(null); // No membership

      await expect(
        queueService.createQueue({ projectId: 'proj-1', name: 'test-q' }, 'user-123')
      ).rejects.toThrow(AuthorizationError);
    });

    it('should successfully create queue if authorized', async () => {
      mockProjectRepo.findById.mockResolvedValue({ id: 'proj-1', organizationId: 'org-1' });
      mockOrgRepo.findMembership.mockResolvedValue({ userId: 'user-123', role: 'MEMBER' });
      mockQueueRepo.findByProjectAndName.mockResolvedValue(null);
      mockQueueRepo.create.mockResolvedValue({ id: 'q-1', name: 'test-q' });

      const result = await queueService.createQueue({ projectId: 'proj-1', name: 'test-q' }, 'user-123');
      expect(result).toEqual({ id: 'q-1', name: 'test-q' });
      expect(mockQueueRepo.create).toHaveBeenCalled();
    });
  });
});
