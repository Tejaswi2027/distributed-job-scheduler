import { JobService } from '../../src/application/services/job.service';
import { ValidationError } from '../../src/shared/errors';

describe('JobService Unit Tests', () => {
  let jobService: JobService;
  let mockJobRepo: any;
  let mockQueueRepo: any;
  let mockProjectRepo: any;
  let mockOrgRepo: any;

  beforeEach(() => {
    mockJobRepo = {
      create: jest.fn(),
      createMany: jest.fn(),
      findById: jest.fn(),
      findByQueueId: jest.fn(),
    };

    mockQueueRepo = {
      findById: jest.fn(),
    };

    mockProjectRepo = {
      findById: jest.fn(),
    };

    mockOrgRepo = {
      findMembership: jest.fn(),
    };

    jobService = new JobService(mockJobRepo, mockQueueRepo, mockProjectRepo, mockOrgRepo);
  });

  describe('enqueueImmediate', () => {
    it('should throw ValidationError if the queue is paused', async () => {
      mockQueueRepo.findById.mockResolvedValue({ id: 'q-1', isPaused: true, projectId: 'proj-1' });

      await expect(
        jobService.enqueueImmediate({ queueId: 'q-1', payload: {} }, 'user-123')
      ).rejects.toThrow(ValidationError);
    });

    it('should successfully enqueue if queue is active and authorized', async () => {
      mockQueueRepo.findById.mockResolvedValue({ id: 'q-1', isPaused: false, projectId: 'proj-1' });
      mockProjectRepo.findById.mockResolvedValue({ id: 'proj-1', organizationId: 'org-1' });
      mockOrgRepo.findMembership.mockResolvedValue({ userId: 'user-123' });
      mockJobRepo.create.mockResolvedValue({ id: 'job-1', status: 'QUEUED' });

      const result = await jobService.enqueueImmediate({ queueId: 'q-1', payload: { data: 'test' } }, 'user-123');
      expect(result).toEqual({ id: 'job-1', status: 'QUEUED' });
      expect(mockJobRepo.create).toHaveBeenCalled();
    });
  });
});
