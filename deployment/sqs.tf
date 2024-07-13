resource "aws_sqs_queue" "audio-events" {
  name                        = "${local.project}-audio-events.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
}
