import json
import unittest
from app import app

class TestGrammarChecker(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_health(self):
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'healthy')
        print("[PASS] Health check endpoint OK")

    def test_empty_text(self):
        res = self.client.post('/api/check-grammar', 
                               data=json.dumps({'text': '   '}),
                               content_type='application/json')
        self.assertEqual(res.status_code, 400)
        print("[PASS] Empty text validation OK")

    def test_example_1_has_apple(self):
        res = self.client.post('/api/check-grammar',
                               data=json.dumps({'text': 'I has a apple.'}),
                               content_type='application/json')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        print(f"Example 1 errors: {data['total_errors']}, stats: {data['stats']}")
        self.assertGreaterEqual(data['total_errors'], 2)
        words = [e['incorrect_text'] for e in data['errors']]
        self.assertIn('has', words)
        self.assertIn('a', words)
        print("[PASS] Example 1 'I has a apple.' OK")

    def test_example_2_she_go(self):
        res = self.client.post('/api/check-grammar',
                               data=json.dumps({'text': 'She go to college everyday.'}),
                               content_type='application/json')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        print(f"Example 2 errors: {data['total_errors']}, stats: {data['stats']}")
        self.assertGreaterEqual(data['total_errors'], 2)
        words = [e['incorrect_text'] for e in data['errors']]
        self.assertIn('go', words)
        self.assertIn('everyday', words)
        print("[PASS] Example 2 'She go to college everyday.' OK")

    def test_example_3_they_is(self):
        res = self.client.post('/api/check-grammar',
                               data=json.dumps({'text': 'They is playing cricket.'}),
                               content_type='application/json')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        print(f"Example 3 errors: {data['total_errors']}, stats: {data['stats']}")
        self.assertGreaterEqual(data['total_errors'], 1)
        words = [e['incorrect_text'] for e in data['errors']]
        self.assertIn('is', words)
        print("[PASS] Example 3 'They is playing cricket.' OK")

    def test_example_4_clean(self):
        res = self.client.post('/api/check-grammar',
                               data=json.dumps({'text': 'I am a student.'}),
                               content_type='application/json')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        print(f"Example 4 errors: {data['total_errors']}, stats: {data['stats']}")
        self.assertEqual(data['total_errors'], 0)
        self.assertEqual(data['stats']['accuracy_score'], 100)
        print("[PASS] Example 4 'I am a student.' OK (0 errors, 100% accuracy)")

if __name__ == '__main__':
    unittest.main()
