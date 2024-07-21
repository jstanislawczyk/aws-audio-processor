resource "aws_sfn_state_machine" "audio_processor" {
  name     = "audio-processor"
  role_arn = aws_iam_role.audio_processor.arn

  definition = <<EOF
{
  "Comment": "Audio Processor State Machine that transcribes audio files to text and transforms them to common format.",
  "StartAt": "TransformAudio",
  "States": {
    "TransformAudio": {
      "Type": "Task",
      "Resource": "${aws_lambda_function.audio_transformer.arn}",
      "End": true
    }
  }
}
EOF
}

resource "aws_iam_role" "audio_processor" {
  name               = "audio-processor"
  assume_role_policy = data.aws_iam_policy_document.audio_processor_policy.json
}

data "aws_iam_policy_document" "audio_processor_policy" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["states.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}


resource "aws_iam_role_policy_attachment" "audio_processor_role_attachment" {
  role       = aws_iam_role.audio_processor.name
  policy_arn = aws_iam_policy.invoke_lambdas.arn
}

resource "aws_iam_policy" "invoke_lambdas" {
  name = "${local.project}-audio-processor-invoke-lambdas"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": [
        "${aws_lambda_function.audio_transformer.arn}"
      ]
    }
  ]
}
EOF
}

